const db = require('../../db/connection');
const { NotFoundError } = require('../utils/errors');

function listProjectsForUser(user) {
  if (user.role === 'admin') {
    return db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
  }
  return db
    .prepare(
      `SELECT p.* FROM projects p
       JOIN project_members m ON m.project_id = p.id
       WHERE m.user_id = ?
       ORDER BY p.created_at DESC`
    )
    .all(user.id);
}

function getProjectById(id) {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  if (!project) throw new NotFoundError('Project not found');
  return project;
}

// FR-UA 2a/2e substrate: PM creates a project and is automatically its first member.
function createProject({ name, description, createdBy }) {
  const info = db
    .prepare('INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)')
    .run(name, description || null, createdBy);
  const projectId = info.lastInsertRowid;
  db.prepare(
    'INSERT INTO project_members (project_id, user_id, guest_restrictions) VALUES (?, ?, NULL)'
  ).run(projectId, createdBy);
  return getProjectById(projectId);
}

function listMembers(projectId) {
  return db
    .prepare(
      `SELECT m.id, m.user_id, m.guest_restrictions, m.added_at,
              u.name, u.email, u.role
       FROM project_members m JOIN users u ON u.id = m.user_id
       WHERE m.project_id = ?
       ORDER BY u.name`
    )
    .all(projectId);
}

// FR-UA 2e: PM assigns analysts/user groups/guests to a project.
function addMember(projectId, { userId, guestRestrictions }) {
  getProjectById(projectId);
  const existing = db
    .prepare('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?')
    .get(projectId, userId);
  const restrictionsJson = guestRestrictions ? JSON.stringify(guestRestrictions) : null;
  if (existing) {
    db.prepare('UPDATE project_members SET guest_restrictions = ? WHERE id = ?').run(
      restrictionsJson,
      existing.id
    );
    return existing.id;
  }
  const info = db
    .prepare(
      'INSERT INTO project_members (project_id, user_id, guest_restrictions) VALUES (?, ?, ?)'
    )
    .run(projectId, userId, restrictionsJson);
  return info.lastInsertRowid;
}

// FR-UA 2f: PM sets/updates restrictions on what a guest can see.
function updateMemberRestrictions(projectId, userId, guestRestrictions) {
  const member = db
    .prepare('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?')
    .get(projectId, userId);
  if (!member) throw new NotFoundError('Project membership not found');
  db.prepare('UPDATE project_members SET guest_restrictions = ? WHERE id = ?').run(
    guestRestrictions ? JSON.stringify(guestRestrictions) : null,
    member.id
  );
}

module.exports = {
  listProjectsForUser,
  getProjectById,
  createProject,
  listMembers,
  addMember,
  updateMemberRestrictions,
};
