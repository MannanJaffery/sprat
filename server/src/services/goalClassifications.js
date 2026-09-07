const db = require('../../db/connection');
const { NotFoundError } = require('../utils/errors');

const CLASSIFICATION_TYPES = [
  'policy_vs_scenario',
  'observable_vs_unobservable',
  'protection_vs_vulnerability',
];

const VALUE_OPTIONS = {
  policy_vs_scenario: ['policy', 'scenario'],
  observable_vs_unobservable: ['observable', 'unobservable'],
  protection_vs_vulnerability: ['protection', 'vulnerability'],
};

function hasSubmittedAll(goalId, analystId) {
  const row = db
    .prepare(
      'SELECT COUNT(DISTINCT classification_type) AS count FROM goal_classifications WHERE goal_id = ? AND analyst_id = ?'
    )
    .get(goalId, analystId);
  return row.count >= CLASSIFICATION_TYPES.length;
}

// FR-ADM 7: an analyst classifies a goal across all three dimensions in one submission.
const submitClassifications = db.transaction((goalId, analystId, values) => {
  const goal = db.prepare('SELECT id FROM goals WHERE id = ?').get(goalId);
  if (!goal) throw new NotFoundError('Goal not found');

  const stmt = db.prepare(
    `INSERT INTO goal_classifications (goal_id, analyst_id, classification_type, classification_value)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (goal_id, analyst_id, classification_type)
     DO UPDATE SET classification_value = excluded.classification_value, submitted_at = datetime('now')`
  );

  for (const type of CLASSIFICATION_TYPES) {
    if (values[type]) stmt.run(goalId, analystId, type, values[type]);
  }
});

// Constraint: another analyst's classification is withheld until the *requesting* analyst
// has submitted their own full classification for this goal. PM/admin always see everything
// (they are the ones running reconciliation, not participants in the bias-prone step).
function getClassifications(goalId, requestingUser) {
  const goal = db.prepare('SELECT id FROM goals WHERE id = ?').get(goalId);
  if (!goal) throw new NotFoundError('Goal not found');

  const canSeeAll =
    requestingUser.role !== 'analyst' || hasSubmittedAll(goalId, requestingUser.id);

  if (canSeeAll) {
    const rows = db
      .prepare(
        `SELECT gc.analyst_id, u.name AS analyst_name, gc.classification_type,
                gc.classification_value, gc.submitted_at
         FROM goal_classifications gc JOIN users u ON u.id = gc.analyst_id
         WHERE gc.goal_id = ?
         ORDER BY u.name, gc.classification_type`
      )
      .all(goalId);
    return { withheld: false, entries: rows };
  }

  const ownRows = db
    .prepare(
      `SELECT classification_type, classification_value, submitted_at
       FROM goal_classifications WHERE goal_id = ? AND analyst_id = ?`
    )
    .all(goalId, requestingUser.id);

  return { withheld: true, entries: ownRows.map((r) => ({ ...r, analyst_id: requestingUser.id })) };
}

// FR-ADM 7: automatic comparison of classification results across analysts, for reconciliation.
function getClassificationDiff(goalId) {
  const goal = db.prepare('SELECT id FROM goals WHERE id = ?').get(goalId);
  if (!goal) throw new NotFoundError('Goal not found');

  const rows = db
    .prepare(
      `SELECT gc.analyst_id, u.name AS analyst_name, gc.classification_type, gc.classification_value
       FROM goal_classifications gc JOIN users u ON u.id = gc.analyst_id
       WHERE gc.goal_id = ?`
    )
    .all(goalId);

  const byType = {};
  for (const type of CLASSIFICATION_TYPES) {
    const entries = rows.filter((r) => r.classification_type === type);
    const distinctValues = [...new Set(entries.map((e) => e.classification_value))];
    byType[type] = {
      entries: entries.map((e) => ({ analystId: e.analyst_id, analystName: e.analyst_name, value: e.classification_value })),
      hasConflict: distinctValues.length > 1,
    };
  }

  return byType;
}

module.exports = {
  CLASSIFICATION_TYPES,
  VALUE_OPTIONS,
  submitClassifications,
  getClassifications,
  getClassificationDiff,
};
