const db = require('../../db/connection');
const { NotFoundError } = require('../utils/errors');

async function attachGoals(scenario) {
  if (!scenario) return scenario;
  const goals = await db.query(
    `SELECT g.id, g.goal_code, g.description
     FROM scenario_goals sg JOIN goals g ON g.id = sg.goal_id
     WHERE sg.scenario_id = $1
     ORDER BY g.goal_code`,
    [scenario.id]
  );
  return { ...scenario, goals };
}

// View any scenario's elements within the project. Optional additive filters let
// scenarios sharing an attribute (status, actor, or a linked goal) be listed
// together for change analysis.
async function listScenarios(projectId, filters = {}) {
  const clauses = ['s.project_id = $1'];
  const params = [projectId];

  if (filters.status) {
    params.push(filters.status);
    clauses.push(`s.status = $${params.length}`);
  }
  if (filters.actor) {
    params.push(`%${filters.actor}%`);
    clauses.push(`s.actors ILIKE $${params.length}`);
  }
  if (filters.goalId) {
    params.push(filters.goalId);
    clauses.push(`s.id IN (SELECT scenario_id FROM scenario_goals WHERE goal_id = $${params.length})`);
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    const p = `$${params.length}`;
    clauses.push(`(s.name ILIKE ${p} OR s.sources ILIKE ${p} OR s.actors ILIKE ${p} OR s.events ILIKE ${p} OR s.actions ILIKE ${p})`);
  }

  const rows = await db.query(
    `SELECT s.* FROM scenarios s WHERE ${clauses.join(' AND ')} ORDER BY s.created_at DESC`,
    params
  );
  return Promise.all(rows.map(attachGoals));
}

async function getScenarioById(id) {
  const scenario = await db.queryOne('SELECT * FROM scenarios WHERE id = $1', [id]);
  if (!scenario) throw new NotFoundError('Scenario not found');
  return attachGoals(scenario);
}

const SCENARIO_FIELDS = [
  'sources', 'actors', 'events', 'actions', 'obstacles', 'constraints',
  'preConditions', 'postConditions', 'status', 'issues', 'requirementsText',
];

const COLUMN_BY_FIELD = {
  sources: 'sources',
  actors: 'actors',
  events: 'events',
  actions: 'actions',
  obstacles: 'obstacles',
  constraints: 'constraints',
  preConditions: 'pre_conditions',
  postConditions: 'post_conditions',
  status: 'status',
  issues: 'issues',
  requirementsText: 'requirements_text',
};

// Add a scenario with its full element set.
async function createScenario(projectId, data) {
  return db.withTransaction(async (tx) => {
    const scenario = await tx.queryOne(
      `INSERT INTO scenarios (
         project_id, name, sources, actors, events, actions, obstacles, constraints,
         pre_conditions, post_conditions, status, issues, requirements_text, created_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id`,
      [
        projectId,
        data.name,
        data.sources || null,
        data.actors || null,
        data.events || null,
        data.actions || null,
        data.obstacles || null,
        data.constraints || null,
        data.preConditions || null,
        data.postConditions || null,
        data.status || 'draft',
        data.issues || null,
        data.requirementsText || null,
        data.createdBy,
      ]
    );

    // "Goals" element: link goals selected at creation time.
    for (const goalId of data.goalIds || []) {
      await tx.query(
        'INSERT INTO scenario_goals (scenario_id, goal_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [scenario.id, goalId]
      );
    }
    return scenario.id;
  });
}

// Edit/modify a scenario.
async function updateScenario(id, data) {
  const scenario = await db.queryOne('SELECT * FROM scenarios WHERE id = $1', [id]);
  if (!scenario) throw new NotFoundError('Scenario not found');

  const setClauses = [];
  const params = [];

  params.push(data.name ?? scenario.name);
  setClauses.push(`name = $${params.length}`);

  for (const field of SCENARIO_FIELDS) {
    const column = COLUMN_BY_FIELD[field];
    params.push(data[field] !== undefined ? data[field] : scenario[column]);
    setClauses.push(`${column} = $${params.length}`);
  }
  setClauses.push('updated_at = now()');
  params.push(id);

  await db.query(`UPDATE scenarios SET ${setClauses.join(', ')} WHERE id = $${params.length}`, params);
}

// Reuse other scenarios' goal linkages when specifying a new scenario.
async function linkGoal(scenarioId, goalId) {
  await getScenarioById(scenarioId);
  await db.query(
    'INSERT INTO scenario_goals (scenario_id, goal_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [scenarioId, goalId]
  );
}

async function unlinkGoal(scenarioId, goalId) {
  await db.query('DELETE FROM scenario_goals WHERE scenario_id = $1 AND goal_id = $2', [
    scenarioId,
    goalId,
  ]);
}

// Delete a scenario.
async function deleteScenario(id) {
  const scenario = await db.queryOne('SELECT id FROM scenarios WHERE id = $1', [id]);
  if (!scenario) throw new NotFoundError('Scenario not found');
  await db.query('DELETE FROM scenarios WHERE id = $1', [id]);
}

module.exports = {
  listScenarios,
  getScenarioById,
  createScenario,
  updateScenario,
  linkGoal,
  unlinkGoal,
  deleteScenario,
};
