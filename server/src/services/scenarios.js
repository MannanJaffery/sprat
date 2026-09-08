const db = require('../../db/connection');
const { NotFoundError } = require('../utils/errors');

function attachGoals(scenario) {
  if (!scenario) return scenario;
  const goals = db
    .prepare(
      `SELECT g.id, g.goal_code, g.description
       FROM scenario_goals sg JOIN goals g ON g.id = sg.goal_id
       WHERE sg.scenario_id = ?
       ORDER BY g.goal_code`
    )
    .all(scenario.id);
  return { ...scenario, goals };
}

// FR-SSM 6: view any scenario's elements within the project.
// FR8 (FR-SSM 7): optional additive filters so scenarios sharing an attribute
// (status, actor, or a linked goal) can be listed together for change analysis.
function listScenarios(projectId, filters = {}) {
  const clauses = ['s.project_id = ?'];
  const params = [projectId];

  if (filters.status) {
    clauses.push('s.status = ?');
    params.push(filters.status);
  }
  if (filters.actor) {
    clauses.push('s.actors LIKE ?');
    params.push(`%${filters.actor}%`);
  }
  if (filters.goalId) {
    clauses.push('s.id IN (SELECT scenario_id FROM scenario_goals WHERE goal_id = ?)');
    params.push(filters.goalId);
  }
  if (filters.search) {
    const like = `%${filters.search}%`;
    clauses.push(
      '(s.name LIKE ? OR s.sources LIKE ? OR s.actors LIKE ? OR s.events LIKE ? OR s.actions LIKE ?)'
    );
    params.push(like, like, like, like, like);
  }

  return db
    .prepare(`SELECT s.* FROM scenarios s WHERE ${clauses.join(' AND ')} ORDER BY s.created_at DESC`)
    .all(...params)
    .map(attachGoals);
}

function getScenarioById(id) {
  const scenario = db.prepare('SELECT * FROM scenarios WHERE id = ?').get(id);
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

// FR-SSM 1: add a scenario with its full element set.
const createScenario = db.transaction((projectId, data) => {
  const info = db
    .prepare(
      `INSERT INTO scenarios (
         project_id, name, sources, actors, events, actions, obstacles, constraints,
         pre_conditions, post_conditions, status, issues, requirements_text, created_by
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
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
      data.createdBy
    );

  const scenarioId = info.lastInsertRowid;
  // FR-SSM 1 "Goals" element: link goals selected at creation time.
  for (const goalId of data.goalIds || []) {
    db.prepare('INSERT OR IGNORE INTO scenario_goals (scenario_id, goal_id) VALUES (?, ?)').run(
      scenarioId,
      goalId
    );
  }
  return scenarioId;
});

// FR-SSM 2: edit/modify a scenario.
function updateScenario(id, data) {
  const scenario = db.prepare('SELECT * FROM scenarios WHERE id = ?').get(id);
  if (!scenario) throw new NotFoundError('Scenario not found');

  const setClauses = ['name = ?'];
  const params = [data.name ?? scenario.name];

  for (const field of SCENARIO_FIELDS) {
    const column = COLUMN_BY_FIELD[field];
    setClauses.push(`${column} = ?`);
    params.push(data[field] !== undefined ? data[field] : scenario[column]);
  }
  setClauses.push("updated_at = datetime('now')");
  params.push(id);

  db.prepare(`UPDATE scenarios SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
}

// FR-SSM 4: reuse other scenarios' goal linkages when specifying a new scenario.
function linkGoal(scenarioId, goalId) {
  getScenarioById(scenarioId);
  db.prepare('INSERT OR IGNORE INTO scenario_goals (scenario_id, goal_id) VALUES (?, ?)').run(
    scenarioId,
    goalId
  );
}

function unlinkGoal(scenarioId, goalId) {
  db.prepare('DELETE FROM scenario_goals WHERE scenario_id = ? AND goal_id = ?').run(
    scenarioId,
    goalId
  );
}

// FR-SSM 3: delete a scenario.
function deleteScenario(id) {
  const scenario = db.prepare('SELECT id FROM scenarios WHERE id = ?').get(id);
  if (!scenario) throw new NotFoundError('Scenario not found');
  db.prepare('DELETE FROM scenarios WHERE id = ?').run(id);
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
