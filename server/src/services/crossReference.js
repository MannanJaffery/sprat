// Read-only cross-reference view for a goal — surfaces other goals related to
// it by source document, taxonomy, subject classification, or legislation.
// Pure SQL, no AI involved.
const db = require('../../db/connection');

async function getGoalCrossReferences(goal) {
  const sameDocument = await db.query(
    `SELECT id, goal_code, description FROM goals WHERE document_id = $1 AND id != $2 ORDER BY goal_code LIMIT 8`,
    [goal.document_id, goal.id]
  );

  const sameTaxonomy = await db.query(
    `SELECT id, goal_code, description FROM goals
     WHERE project_id = $1 AND taxonomy_category = $2 AND taxonomy_subtype = $3 AND id != $4
     ORDER BY goal_code LIMIT 8`,
    [goal.project_id, goal.taxonomy_category, goal.taxonomy_subtype, goal.id]
  );

  const sameSubject = goal.subjectClassifications?.length
    ? await db.query(
        `SELECT DISTINCT g.id, g.goal_code, g.description
         FROM goals g JOIN goal_subject_classifications gsc ON gsc.goal_id = g.id
         WHERE g.project_id = $1 AND gsc.subject_classification = ANY($2::text[]) AND g.id != $3
         ORDER BY g.goal_code LIMIT 8`,
        [goal.project_id, goal.subjectClassifications, goal.id]
      )
    : [];

  const sameLegislation = goal.relevant_legislation
    ? await db.query(
        `SELECT id, goal_code, description FROM goals
         WHERE project_id = $1 AND relevant_legislation = $2 AND id != $3
         ORDER BY goal_code LIMIT 8`,
        [goal.project_id, goal.relevant_legislation, goal.id]
      )
    : [];

  return { sameDocument, sameTaxonomy, sameSubject, sameLegislation };
}

module.exports = { getGoalCrossReferences };
