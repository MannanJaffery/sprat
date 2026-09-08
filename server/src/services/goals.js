const db = require('../../db/connection');
const { NotFoundError, ConflictError } = require('../utils/errors');

function attachDetails(goal) {
  if (!goal) return goal;
  const subjectClassifications = db
    .prepare(
      'SELECT subject_classification FROM goal_subject_classifications WHERE goal_id = ? ORDER BY subject_classification'
    )
    .all(goal.id)
    .map((r) => r.subject_classification);

  const documentLinks = db
    .prepare(
      `SELECT gdl.document_id, gdl.occurrence_count, d.name AS document_name
       FROM goal_document_links gdl JOIN documents d ON d.id = gdl.document_id
       WHERE gdl.goal_id = ?
       ORDER BY d.name`
    )
    .all(goal.id);

  return { ...goal, observable: Boolean(goal.observable), subjectClassifications, documentLinks };
}

// FR-GSM 1/3/4/7/8 substrate + FR8 (FR-GSM 16/17): attribute-based search. Every
// filter is optional and additive, so analysts and guests can narrow goals by any
// combination of taxonomy, subject, actor, source document, legislation, etc.
function listGoals(projectId, filters = {}) {
  const clauses = ['g.project_id = ?'];
  const params = [projectId];

  if (filters.documentId) {
    clauses.push('g.document_id = ?');
    params.push(filters.documentId);
  }
  if (filters.taxonomyCategory) {
    clauses.push('g.taxonomy_category = ?');
    params.push(filters.taxonomyCategory);
  }
  if (filters.taxonomySubtype) {
    clauses.push('g.taxonomy_subtype = ?');
    params.push(filters.taxonomySubtype);
  }
  if (filters.granularity) {
    clauses.push('g.granularity = ?');
    params.push(filters.granularity);
  }
  if (filters.observable === 'true' || filters.observable === true) {
    clauses.push('g.observable = 1');
  } else if (filters.observable === 'false' || filters.observable === false) {
    clauses.push('g.observable = 0');
  }
  if (filters.actor) {
    clauses.push('g.actor LIKE ?');
    params.push(`%${filters.actor}%`);
  }
  if (filters.legislation) {
    clauses.push('g.relevant_legislation LIKE ?');
    params.push(`%${filters.legislation}%`);
  }
  if (filters.subjectClassification) {
    clauses.push(
      'g.id IN (SELECT goal_id FROM goal_subject_classifications WHERE subject_classification = ?)'
    );
    params.push(filters.subjectClassification);
  }
  if (filters.search) {
    clauses.push('(g.description LIKE ? OR g.actor LIKE ? OR g.goal_code LIKE ? OR g.context_excerpt LIKE ?)');
    const like = `%${filters.search}%`;
    params.push(like, like, like, like);
  }

  const rows = db
    .prepare(
      `SELECT g.* FROM goals g WHERE ${clauses.join(' AND ')} ORDER BY g.created_at DESC`
    )
    .all(...params);

  return rows.map(attachDetails);
}

function getGoalById(id) {
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
  if (!goal) throw new NotFoundError('Goal not found');
  return attachDetails(goal);
}

function setSubjectClassifications(goalId, classifications) {
  db.prepare('DELETE FROM goal_subject_classifications WHERE goal_id = ?').run(goalId);
  const insert = db.prepare(
    'INSERT INTO goal_subject_classifications (goal_id, subject_classification) VALUES (?, ?)'
  );
  for (const classification of classifications || []) {
    insert.run(goalId, classification);
  }
}

// FR-GSM 1: add a new goal, with full taxonomy/subject classification/actor/context/legislation.
const createGoal = db.transaction((projectId, data) => {
  const existingCode = db
    .prepare('SELECT id FROM goals WHERE project_id = ? AND goal_code = ?')
    .get(projectId, data.goalCode);
  if (existingCode) throw new ConflictError('A goal with this Goal ID already exists in this project.');

  const info = db
    .prepare(
      `INSERT INTO goals (
         project_id, document_id, goal_code, description, taxonomy_category, taxonomy_subtype,
         granularity, observable, actor, context_excerpt, relevant_legislation, created_by
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      projectId,
      data.documentId,
      data.goalCode,
      data.description,
      data.taxonomyCategory,
      data.taxonomySubtype,
      data.granularity,
      data.observable ? 1 : 0,
      data.actor || null,
      data.contextExcerpt || null,
      data.relevantLegislation || null,
      data.createdBy
    );

  const goalId = info.lastInsertRowid;
  setSubjectClassifications(goalId, data.subjectClassifications);

  // The document a goal is added from is its first recorded occurrence (FR-GSM11/12).
  db.prepare(
    `INSERT INTO goal_document_links (goal_id, document_id, occurrence_count)
     VALUES (?, ?, 1)
     ON CONFLICT (goal_id, document_id) DO UPDATE SET occurrence_count = occurrence_count + 1`
  ).run(goalId, data.documentId);

  return goalId;
});

// FR-GSM 7: edit an existing goal.
const updateGoal = db.transaction((id, data) => {
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
  if (!goal) throw new NotFoundError('Goal not found');

  db.prepare(
    `UPDATE goals SET
       description = ?, taxonomy_category = ?, taxonomy_subtype = ?, granularity = ?,
       observable = ?, actor = ?, context_excerpt = ?, relevant_legislation = ?,
       updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    data.description ?? goal.description,
    data.taxonomyCategory ?? goal.taxonomy_category,
    data.taxonomySubtype ?? goal.taxonomy_subtype,
    data.granularity ?? goal.granularity,
    data.observable !== undefined ? (data.observable ? 1 : 0) : goal.observable,
    data.actor !== undefined ? data.actor : goal.actor,
    data.contextExcerpt !== undefined ? data.contextExcerpt : goal.context_excerpt,
    data.relevantLegislation !== undefined ? data.relevantLegislation : goal.relevant_legislation,
    id
  );

  if (data.subjectClassifications) {
    setSubjectClassifications(id, data.subjectClassifications);
  }
});

// FR-GSM 8: delete a goal outright (no replacement).
function deleteGoal(id) {
  const goal = db.prepare('SELECT id FROM goals WHERE id = ?').get(id);
  if (!goal) throw new NotFoundError('Goal not found');
  db.prepare('DELETE FROM goals WHERE id = ?').run(id);
}

// FR-GSM 9: deleting/replacing a goal automatically propagates its policy and scenario
// links to the replacement goal, instead of leaving those links dangling.
const replaceGoal = db.transaction((id, newGoalId) => {
  const goal = db.prepare('SELECT id FROM goals WHERE id = ?').get(id);
  if (!goal) throw new NotFoundError('Goal to replace not found');
  const replacement = db.prepare('SELECT id FROM goals WHERE id = ?').get(newGoalId);
  if (!replacement) throw new NotFoundError('Replacement goal not found');
  if (id === newGoalId) throw new ConflictError('A goal cannot replace itself.');

  const documentLinks = db
    .prepare('SELECT document_id, occurrence_count FROM goal_document_links WHERE goal_id = ?')
    .all(id);
  for (const link of documentLinks) {
    db.prepare(
      `INSERT INTO goal_document_links (goal_id, document_id, occurrence_count)
       VALUES (?, ?, ?)
       ON CONFLICT (goal_id, document_id) DO UPDATE SET occurrence_count = occurrence_count + excluded.occurrence_count`
    ).run(newGoalId, link.document_id, link.occurrence_count);
  }

  const scenarioLinks = db
    .prepare('SELECT scenario_id FROM scenario_goals WHERE goal_id = ?')
    .all(id);
  for (const link of scenarioLinks) {
    db.prepare(
      'INSERT OR IGNORE INTO scenario_goals (scenario_id, goal_id) VALUES (?, ?)'
    ).run(link.scenario_id, newGoalId);
  }

  db.prepare('DELETE FROM goals WHERE id = ?').run(id);

  return { policiesUpdated: documentLinks.length, scenariosUpdated: scenarioLinks.length };
});

// FR-GSM 11/12: occurrence analytics for a policy document.
function getDocumentGoalOccurrences(documentId) {
  return db
    .prepare(
      `SELECT g.id AS goal_id, g.goal_code, g.description, gdl.occurrence_count
       FROM goal_document_links gdl JOIN goals g ON g.id = gdl.goal_id
       WHERE gdl.document_id = ?
       ORDER BY gdl.occurrence_count DESC, g.goal_code`
    )
    .all(documentId);
}

function getDocumentDistinctGoalCount(documentId) {
  const row = db
    .prepare('SELECT COUNT(DISTINCT goal_id) AS count FROM goal_document_links WHERE document_id = ?')
    .get(documentId);
  return row.count;
}

// FR-GSM 10 / FR6: traceability — every policy and scenario a goal appears in.
function getGoalTraceability(goalId) {
  getGoalById(goalId);
  const policies = db
    .prepare(
      `SELECT d.id AS document_id, d.name AS document_name, gdl.occurrence_count
       FROM goal_document_links gdl JOIN documents d ON d.id = gdl.document_id
       WHERE gdl.goal_id = ?
       ORDER BY d.name`
    )
    .all(goalId);

  const scenarios = db
    .prepare(
      `SELECT s.id AS scenario_id, s.name AS scenario_name, s.status
       FROM scenario_goals sg JOIN scenarios s ON s.id = sg.scenario_id
       WHERE sg.goal_id = ?
       ORDER BY s.name`
    )
    .all(goalId);

  return { policies, scenarios };
}

// FR-GSM 10/11: link an existing goal to another policy document it also occurs in.
function linkGoalToDocument(goalId, documentId) {
  getGoalById(goalId);
  db.prepare(
    `INSERT INTO goal_document_links (goal_id, document_id, occurrence_count)
     VALUES (?, ?, 1)
     ON CONFLICT (goal_id, document_id) DO UPDATE SET occurrence_count = occurrence_count + 1`
  ).run(goalId, documentId);
}

module.exports = {
  listGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  replaceGoal,
  getDocumentGoalOccurrences,
  getDocumentDistinctGoalCount,
  getGoalTraceability,
  linkGoalToDocument,
};
