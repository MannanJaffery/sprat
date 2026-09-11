const db = require('../../db/connection');
const { NotFoundError, ApiError } = require('../utils/errors');

// The three built-in classification dimensions every goal carries.
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

async function getGoal(goalId) {
  const goal = await db.queryOne('SELECT id, project_id FROM goals WHERE id = $1', [goalId]);
  if (!goal) throw new NotFoundError('Goal not found');
  return goal;
}

// Built-in dimensions plus any project-defined ones.
async function getTypesForGoal(goalId) {
  const goal = await getGoal(goalId);
  const customRows = await db.query(
    'SELECT id, type_key, label, options FROM classification_types WHERE project_id = $1 ORDER BY created_at',
    [goal.project_id]
  );
  const custom = customRows.map((r) => ({
    key: r.type_key,
    label: r.label,
    options: JSON.parse(r.options),
    custom: true,
    id: r.id,
  }));
  return {
    goal,
    builtIn: BUILT_IN_TYPES.map((t) => ({ ...t, custom: false })),
    custom,
    all: [...BUILT_IN_TYPES.map((t) => ({ ...t, custom: false })), ...custom],
  };
}

async function hasSubmittedAll(goalId, analystId, typeCount) {
  const builtIn = await db.queryOne(
    'SELECT COUNT(DISTINCT classification_type) AS count FROM goal_classifications WHERE goal_id = $1 AND analyst_id = $2',
    [goalId, analystId]
  );
  const custom = await db.queryOne(
    'SELECT COUNT(DISTINCT classification_type_id) AS count FROM goal_custom_classifications WHERE goal_id = $1 AND analyst_id = $2',
    [goalId, analystId]
  );
  return Number(builtIn.count) + Number(custom.count) >= typeCount;
}

// An analyst classifies a goal across every dimension in one submission.
async function submitClassifications(goalId, analystId, values) {
  return db.withTransaction(async (tx) => {
    const { all } = await getTypesForGoal(goalId);
    const typeByKey = Object.fromEntries(all.map((t) => [t.key, t]));

    for (const [key, value] of Object.entries(values || {})) {
      if (value == null || value === '') continue;
      const type = typeByKey[key];
      if (!type) throw new ApiError(400, `Unknown classification type: ${key}`);
      if (!type.options.includes(value)) {
        throw new ApiError(400, `Invalid value "${value}" for ${type.label}.`);
      }
      if (type.custom) {
        await tx.query(
          `INSERT INTO goal_custom_classifications (goal_id, classification_type_id, analyst_id, value)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (goal_id, classification_type_id, analyst_id)
           DO UPDATE SET value = excluded.value, submitted_at = now()`,
          [goalId, type.id, analystId, value]
        );
      } else {
        await tx.query(
          `INSERT INTO goal_classifications (goal_id, analyst_id, classification_type, classification_value)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (goal_id, analyst_id, classification_type)
           DO UPDATE SET classification_value = excluded.classification_value, submitted_at = now()`,
          [goalId, analystId, key, value]
        );
      }
    }
  });
}

async function collectEntries(goalId) {
  const builtIn = await db.query(
    `SELECT gc.analyst_id, u.name AS analyst_name, gc.classification_type AS type_key,
            gc.classification_value AS value, gc.submitted_at
     FROM goal_classifications gc JOIN profiles u ON u.id = gc.analyst_id
     WHERE gc.goal_id = $1`,
    [goalId]
  );
  const custom = await db.query(
    `SELECT gcc.analyst_id, u.name AS analyst_name, ct.type_key AS type_key,
            gcc.value AS value, gcc.submitted_at
     FROM goal_custom_classifications gcc
     JOIN profiles u ON u.id = gcc.analyst_id
     JOIN classification_types ct ON ct.id = gcc.classification_type_id
     WHERE gcc.goal_id = $1`,
    [goalId]
  );
  return [...builtIn, ...custom];
}

// Another analyst's classification is withheld until the requesting analyst has
// submitted their own full set, to prevent bias. PM/admin always see everything
// — they run reconciliation, they don't classify.
async function getClassifications(goalId, requestingUser) {
  const { all } = await getTypesForGoal(goalId);
  const labelByKey = Object.fromEntries(all.map((t) => [t.key, t.label]));

  const canSeeAll =
    requestingUser.role !== 'analyst' || (await hasSubmittedAll(goalId, requestingUser.id, all.length));

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

  const entries = await collectEntries(goalId);
  if (canSeeAll) {
    return { withheld: false, types: all, entries: decorate(entries) };
  }
  const own = entries.filter((r) => r.analyst_id === requestingUser.id);
  return { withheld: true, types: all, entries: decorate(own) };
}

// Automatic comparison of results across analysts, flagging conflicts.
async function getClassificationDiff(goalId) {
  const { all } = await getTypesForGoal(goalId);
  const rows = await collectEntries(goalId);

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
