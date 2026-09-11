const db = require('../../db/connection');
const { NotFoundError, ConflictError } = require('../utils/errors');

async function attachDetails(goal) {
  if (!goal) return goal;
  const subjectRows = await db.query(
    'SELECT subject_classification FROM goal_subject_classifications WHERE goal_id = $1 ORDER BY subject_classification',
    [goal.id]
  );
  const subjectClassifications = subjectRows.map((r) => r.subject_classification);

  const documentLinks = await db.query(
    `SELECT gdl.document_id, gdl.occurrence_count, d.name AS document_name
     FROM goal_document_links gdl JOIN documents d ON d.id = gdl.document_id
     WHERE gdl.goal_id = $1
     ORDER BY d.name`,
    [goal.id]
  );

  return { ...goal, observable: Boolean(goal.observable), subjectClassifications, documentLinks };
}

// Attribute-based search across goals. Every filter is optional and additive, so
// analysts and guests can narrow goals by any combination of taxonomy, subject,
// actor, source document, legislation, etc.
async function listGoals(projectId, filters = {}) {
  const clauses = ['g.project_id = $1'];
  const params = [projectId];

  if (filters.documentId) {
    params.push(filters.documentId);
    clauses.push(`g.document_id = $${params.length}`);
  }
  if (filters.taxonomyCategory) {
    params.push(filters.taxonomyCategory);
    clauses.push(`g.taxonomy_category = $${params.length}`);
  }
  if (filters.taxonomySubtype) {
    params.push(filters.taxonomySubtype);
    clauses.push(`g.taxonomy_subtype = $${params.length}`);
  }
  if (filters.granularity) {
    params.push(filters.granularity);
    clauses.push(`g.granularity = $${params.length}`);
  }
  if (filters.observable === 'true' || filters.observable === true) {
    clauses.push('g.observable = true');
  } else if (filters.observable === 'false' || filters.observable === false) {
    clauses.push('g.observable = false');
  }
  if (filters.actor) {
    params.push(`%${filters.actor}%`);
    clauses.push(`g.actor ILIKE $${params.length}`);
  }
  if (filters.legislation) {
    params.push(`%${filters.legislation}%`);
    clauses.push(`g.relevant_legislation ILIKE $${params.length}`);
  }
  if (filters.subjectClassification) {
    params.push(filters.subjectClassification);
    clauses.push(
      `g.id IN (SELECT goal_id FROM goal_subject_classifications WHERE subject_classification = $${params.length})`
    );
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    const p = `$${params.length}`;
    clauses.push(`(g.description ILIKE ${p} OR g.actor ILIKE ${p} OR g.goal_code ILIKE ${p} OR g.context_excerpt ILIKE ${p})`);
  }

  const rows = await db.query(
    `SELECT g.* FROM goals g WHERE ${clauses.join(' AND ')} ORDER BY g.created_at DESC`,
    params
  );

  return Promise.all(rows.map(attachDetails));
}

async function getGoalById(id) {
  const goal = await db.queryOne('SELECT * FROM goals WHERE id = $1', [id]);
  if (!goal) throw new NotFoundError('Goal not found');
  return attachDetails(goal);
}

async function setSubjectClassifications(tx, goalId, classifications) {
  await tx.query('DELETE FROM goal_subject_classifications WHERE goal_id = $1', [goalId]);
  for (const classification of classifications || []) {
    await tx.query(
      'INSERT INTO goal_subject_classifications (goal_id, subject_classification) VALUES ($1, $2)',
      [goalId, classification]
    );
  }
}

// Add a new goal, with full taxonomy/subject classification/actor/context/legislation.
async function createGoal(projectId, data) {
  return db.withTransaction(async (tx) => {
    const existingCode = await tx.queryOne(
      'SELECT id FROM goals WHERE project_id = $1 AND goal_code = $2',
      [projectId, data.goalCode]
    );
    if (existingCode) {
      throw new ConflictError('A goal with this Goal ID already exists in this project.');
    }

    const goal = await tx.queryOne(
      `INSERT INTO goals (
         project_id, document_id, goal_code, description, taxonomy_category, taxonomy_subtype,
         granularity, observable, actor, context_excerpt, relevant_legislation, created_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        projectId,
        data.documentId,
        data.goalCode,
        data.description,
        data.taxonomyCategory,
        data.taxonomySubtype,
        data.granularity,
        Boolean(data.observable),
        data.actor || null,
        data.contextExcerpt || null,
        data.relevantLegislation || null,
        data.createdBy,
      ]
    );

    await setSubjectClassifications(tx, goal.id, data.subjectClassifications);

    // The document a goal is added from is its first recorded occurrence.
    await tx.query(
      `INSERT INTO goal_document_links (goal_id, document_id, occurrence_count)
       VALUES ($1, $2, 1)
       ON CONFLICT (goal_id, document_id) DO UPDATE SET occurrence_count = goal_document_links.occurrence_count + 1`,
      [goal.id, data.documentId]
    );

    return goal.id;
  });
}

// Edit an existing goal.
async function updateGoal(id, data) {
  return db.withTransaction(async (tx) => {
    const goal = await tx.queryOne('SELECT * FROM goals WHERE id = $1', [id]);
    if (!goal) throw new NotFoundError('Goal not found');

    await tx.query(
      `UPDATE goals SET
         description = $1, taxonomy_category = $2, taxonomy_subtype = $3, granularity = $4,
         observable = $5, actor = $6, context_excerpt = $7, relevant_legislation = $8,
         updated_at = now()
       WHERE id = $9`,
      [
        data.description ?? goal.description,
        data.taxonomyCategory ?? goal.taxonomy_category,
        data.taxonomySubtype ?? goal.taxonomy_subtype,
        data.granularity ?? goal.granularity,
        data.observable !== undefined ? Boolean(data.observable) : goal.observable,
        data.actor !== undefined ? data.actor : goal.actor,
        data.contextExcerpt !== undefined ? data.contextExcerpt : goal.context_excerpt,
        data.relevantLegislation !== undefined ? data.relevantLegislation : goal.relevant_legislation,
        id,
      ]
    );

    if (data.subjectClassifications) {
      await setSubjectClassifications(tx, id, data.subjectClassifications);
    }
  });
}

// Delete a goal outright (no replacement).
async function deleteGoal(id) {
  const goal = await db.queryOne('SELECT id FROM goals WHERE id = $1', [id]);
  if (!goal) throw new NotFoundError('Goal not found');
  await db.query('DELETE FROM goals WHERE id = $1', [id]);
}

// Deleting/replacing a goal automatically propagates its policy and scenario
// links to the replacement goal, instead of leaving those links dangling.
async function replaceGoal(id, newGoalId) {
  return db.withTransaction(async (tx) => {
    const goal = await tx.queryOne('SELECT id FROM goals WHERE id = $1', [id]);
    if (!goal) throw new NotFoundError('Goal to replace not found');
    const replacement = await tx.queryOne('SELECT id FROM goals WHERE id = $1', [newGoalId]);
    if (!replacement) throw new NotFoundError('Replacement goal not found');
    if (id === newGoalId) throw new ConflictError('A goal cannot replace itself.');

    const documentLinks = await tx.query(
      'SELECT document_id, occurrence_count FROM goal_document_links WHERE goal_id = $1',
      [id]
    );
    for (const link of documentLinks) {
      await tx.query(
        `INSERT INTO goal_document_links (goal_id, document_id, occurrence_count)
         VALUES ($1, $2, $3)
         ON CONFLICT (goal_id, document_id)
         DO UPDATE SET occurrence_count = goal_document_links.occurrence_count + excluded.occurrence_count`,
        [newGoalId, link.document_id, link.occurrence_count]
      );
    }

    const scenarioLinks = await tx.query('SELECT scenario_id FROM scenario_goals WHERE goal_id = $1', [id]);
    for (const link of scenarioLinks) {
      await tx.query(
        'INSERT INTO scenario_goals (scenario_id, goal_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [link.scenario_id, newGoalId]
      );
    }

    await tx.query('DELETE FROM goals WHERE id = $1', [id]);

    return { policiesUpdated: documentLinks.length, scenariosUpdated: scenarioLinks.length };
  });
}

// Occurrence analytics for a policy document.
async function getDocumentGoalOccurrences(documentId) {
  return db.query(
    `SELECT g.id AS goal_id, g.goal_code, g.description, gdl.occurrence_count
     FROM goal_document_links gdl JOIN goals g ON g.id = gdl.goal_id
     WHERE gdl.document_id = $1
     ORDER BY gdl.occurrence_count DESC, g.goal_code`,
    [documentId]
  );
}

async function getDocumentDistinctGoalCount(documentId) {
  const row = await db.queryOne(
    'SELECT COUNT(DISTINCT goal_id) AS count FROM goal_document_links WHERE document_id = $1',
    [documentId]
  );
  return Number(row.count);
}

// Traceability — every policy and scenario a goal appears in.
async function getGoalTraceability(goalId) {
  await getGoalById(goalId);
  const policies = await db.query(
    `SELECT d.id AS document_id, d.name AS document_name, gdl.occurrence_count
     FROM goal_document_links gdl JOIN documents d ON d.id = gdl.document_id
     WHERE gdl.goal_id = $1
     ORDER BY d.name`,
    [goalId]
  );

  const scenarios = await db.query(
    `SELECT s.id AS scenario_id, s.name AS scenario_name, s.status
     FROM scenario_goals sg JOIN scenarios s ON s.id = sg.scenario_id
     WHERE sg.goal_id = $1
     ORDER BY s.name`,
    [goalId]
  );

  return { policies, scenarios };
}

// Link an existing goal to another policy document it also occurs in.
async function linkGoalToDocument(goalId, documentId) {
  await getGoalById(goalId);
  await db.query(
    `INSERT INTO goal_document_links (goal_id, document_id, occurrence_count)
     VALUES ($1, $2, 1)
     ON CONFLICT (goal_id, document_id) DO UPDATE SET occurrence_count = goal_document_links.occurrence_count + 1`,
    [goalId, documentId]
  );
}

// Same domain-restriction rule the list endpoint applies for guests: goals
// whose source document sits outside their allowed domains are invisible,
// including to anything (like AI features) built on top of the goal list.
async function filterGoalsByDomainAccess(goals, projectMembership) {
  const { restricted, allowedDomainIds } = projectMembership || {};
  if (!restricted) return goals;

  const visible = [];
  for (const g of goals) {
    const doc = await db.queryOne('SELECT domain_id FROM documents WHERE id = $1', [g.document_id]);
    if (doc?.domain_id != null && allowedDomainIds.includes(doc.domain_id)) visible.push(g);
  }
  return visible;
}

module.exports = {
  listGoals,
  getGoalById,
  filterGoalsByDomainAccess,
  createGoal,
  updateGoal,
  deleteGoal,
  replaceGoal,
  getDocumentGoalOccurrences,
  getDocumentDistinctGoalCount,
  getGoalTraceability,
  linkGoalToDocument,
};
