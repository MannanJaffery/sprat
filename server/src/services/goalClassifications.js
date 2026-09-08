const db = require('../../db/connection');
const { NotFoundError, ApiError } = require('../utils/errors');

// FR-GSM 3: the three built-in classification dimensions every goal carries.
const BUILT_IN_TYPES = [
  { key: 'policy_vs_scenario', label: 'Policy Goal vs. Scenario Goal', options: ['policy', 'scenario'] },
  {
    key: 'observable_vs_unobservable',
    label: 'Observable vs. Unobservable',
    options: ['observable', 'unobservable'],
  },
  {
    key: 'protection_vs_vulnerability',
    label: 'Protection vs. Vulnerability',
    options: ['protection', 'vulnerability'],
  },
];

const CLASSIFICATION_TYPES = BUILT_IN_TYPES.map((t) => t.key);
const VALUE_OPTIONS = Object.fromEntries(BUILT_IN_TYPES.map((t) => [t.key, t.options]));
const BUILT_IN_BY_KEY = Object.fromEntries(BUILT_IN_TYPES.map((t) => [t.key, t]));

function getGoal(goalId) {
  const goal = db.prepare('SELECT id, project_id FROM goals WHERE id = ?').get(goalId);
  if (!goal) throw new NotFoundError('Goal not found');
  return goal;
}

// FR-GSM 3/5: built-in dimensions plus any project-defined ones (FR9).
function getTypesForGoal(goalId) {
  const goal = getGoal(goalId);
  const custom = db
    .prepare('SELECT id, type_key, label, options FROM classification_types WHERE project_id = ? ORDER BY created_at')
    .all(goal.project_id)
    .map((r) => ({ key: r.type_key, label: r.label, options: JSON.parse(r.options), custom: true, id: r.id }));
  return {
    goal,
    builtIn: BUILT_IN_TYPES.map((t) => ({ ...t, custom: false })),
    custom,
    all: [...BUILT_IN_TYPES.map((t) => ({ ...t, custom: false })), ...custom],
  };
}

function hasSubmittedAll(goalId, analystId, typeCount) {
  const builtInCount = db
    .prepare(
      'SELECT COUNT(DISTINCT classification_type) AS count FROM goal_classifications WHERE goal_id = ? AND analyst_id = ?'
    )
    .get(goalId, analystId).count;
  const customCount = db
    .prepare(
      'SELECT COUNT(DISTINCT classification_type_id) AS count FROM goal_custom_classifications WHERE goal_id = ? AND analyst_id = ?'
    )
    .get(goalId, analystId).count;
  return builtInCount + customCount >= typeCount;
}

// FR-ADM 7: an analyst classifies a goal across every dimension in one submission.
const submitClassifications = db.transaction((goalId, analystId, values) => {
  const { all } = getTypesForGoal(goalId);
  const typeByKey = Object.fromEntries(all.map((t) => [t.key, t]));

  const builtInStmt = db.prepare(
    `INSERT INTO goal_classifications (goal_id, analyst_id, classification_type, classification_value)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (goal_id, analyst_id, classification_type)
     DO UPDATE SET classification_value = excluded.classification_value, submitted_at = datetime('now')`
  );
  const customStmt = db.prepare(
    `INSERT INTO goal_custom_classifications (goal_id, classification_type_id, analyst_id, value)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (goal_id, classification_type_id, analyst_id)
     DO UPDATE SET value = excluded.value, submitted_at = datetime('now')`
  );

  for (const [key, value] of Object.entries(values || {})) {
    if (value == null || value === '') continue;
    const type = typeByKey[key];
    if (!type) throw new ApiError(400, `Unknown classification type: ${key}`);
    if (!type.options.includes(value)) {
      throw new ApiError(400, `Invalid value "${value}" for ${type.label}.`);
    }
    if (type.custom) {
      customStmt.run(goalId, type.id, analystId, value);
    } else {
      builtInStmt.run(goalId, analystId, key, value);
    }
  }
});

function collectEntries(goalId) {
  const builtIn = db
    .prepare(
      `SELECT gc.analyst_id, u.name AS analyst_name, gc.classification_type AS type_key,
              gc.classification_value AS value, gc.submitted_at
       FROM goal_classifications gc JOIN users u ON u.id = gc.analyst_id
       WHERE gc.goal_id = ?`
    )
    .all(goalId);
  const custom = db
    .prepare(
      `SELECT gcc.analyst_id, u.name AS analyst_name, ct.type_key AS type_key,
              gcc.value AS value, gcc.submitted_at
       FROM goal_custom_classifications gcc
       JOIN users u ON u.id = gcc.analyst_id
       JOIN classification_types ct ON ct.id = gcc.classification_type_id
       WHERE gcc.goal_id = ?`
    )
    .all(goalId);
  return [...builtIn, ...custom];
}

// Constraint (FR-ADM 7): another analyst's classification is withheld until the
// requesting analyst has submitted their own full set, to prevent bias. PM/admin
// always see everything — they run reconciliation, they don't classify.
function getClassifications(goalId, requestingUser) {
  const { all } = getTypesForGoal(goalId);
  const labelByKey = Object.fromEntries(all.map((t) => [t.key, t.label]));

  const canSeeAll =
    requestingUser.role !== 'analyst' || hasSubmittedAll(goalId, requestingUser.id, all.length);

  const decorate = (rows) =>
    rows
      .map((r) => ({
        analyst_id: r.analyst_id,
        analyst_name: r.analyst_name,
        classification_type: r.type_key,
        classification_label: labelByKey[r.type_key] || r.type_key,
        classification_value: r.value,
        submitted_at: r.submitted_at,
      }))
      .sort((a, b) =>
        (a.analyst_name || '').localeCompare(b.analyst_name || '') ||
        a.classification_type.localeCompare(b.classification_type)
      );

  if (canSeeAll) {
    return { withheld: false, types: all, entries: decorate(collectEntries(goalId)) };
  }
  const own = collectEntries(goalId).filter((r) => r.analyst_id === requestingUser.id);
  return { withheld: true, types: all, entries: decorate(own) };
}

// FR-ADM 7: automatic comparison of results across analysts, flagging conflicts.
function getClassificationDiff(goalId) {
  const { all } = getTypesForGoal(goalId);
  const rows = collectEntries(goalId);

  const byType = {};
  for (const type of all) {
    const entries = rows.filter((r) => r.type_key === type.key);
    const distinctValues = [...new Set(entries.map((e) => e.value))];
    byType[type.key] = {
      label: type.label,
      custom: type.custom,
      entries: entries.map((e) => ({
        analystId: e.analyst_id,
        analystName: e.analyst_name,
        value: e.value,
      })),
      hasConflict: distinctValues.length > 1,
    };
  }
  return byType;
}

module.exports = {
  CLASSIFICATION_TYPES,
  VALUE_OPTIONS,
  BUILT_IN_TYPES,
  BUILT_IN_BY_KEY,
  getTypesForGoal,
  submitClassifications,
  getClassifications,
  getClassificationDiff,
};
