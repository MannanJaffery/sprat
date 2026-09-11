const db = require('../../db/connection');
const { NotFoundError, ConflictError } = require('../utils/errors');

// Every active user can browse every project (name/description/member count) to
// discover and request to join it — that's purely informational. Actual project
// data (goals/scenarios/documents/etc.) still requires real membership, enforced
// separately by requireProjectMember() on every one of those routes.
async function listProjectsForUser(viewerId) {
  return db.query(
    `SELECT p.*,
            (SELECT COUNT(*) FROM project_members m WHERE m.project_id = p.id) AS member_count,
            EXISTS (
              SELECT 1 FROM project_members m WHERE m.project_id = p.id AND m.user_id = $1
            ) AS is_member,
            (
              SELECT r.status FROM project_join_requests r
              WHERE r.project_id = p.id AND r.requested_by = $1
              ORDER BY r.created_at DESC LIMIT 1
            ) AS join_request_status
     FROM projects p
     ORDER BY p.created_at DESC`,
    [viewerId]
  );
}

async function getProjectById(id) {
  const project = await db.queryOne('SELECT * FROM projects WHERE id = $1', [id]);
  if (!project) throw new NotFoundError('Project not found');
  return project;
}

// PM creates a project and is automatically its first member.
async function createProject({ name, description, createdBy }) {
  return db.withTransaction(async (tx) => {
    const project = await tx.queryOne(
      'INSERT INTO projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name, description || null, createdBy]
    );
    await tx.query(
      'INSERT INTO project_members (project_id, user_id, guest_restrictions) VALUES ($1, $2, NULL)',
      [project.id, createdBy]
    );
    return project;
  });
}

async function listMembers(projectId) {
  return db.query(
    `SELECT m.id, m.user_id, m.guest_restrictions, m.added_at,
            u.name, u.email, u.role
     FROM project_members m JOIN profiles u ON u.id = m.user_id
     WHERE m.project_id = $1
     ORDER BY u.name`,
    [projectId]
  );
}

// PM assigns analysts/user groups/guests to a project.
async function addMember(projectId, { userId, guestRestrictions }) {
  await getProjectById(projectId);
  const restrictionsJson = guestRestrictions ? JSON.stringify(guestRestrictions) : null;
  const existing = await db.queryOne(
    'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );
  if (existing) {
    await db.query('UPDATE project_members SET guest_restrictions = $1 WHERE id = $2', [
      restrictionsJson,
      existing.id,
    ]);
    return existing.id;
  }
  const inserted = await db.queryOne(
    `INSERT INTO project_members (project_id, user_id, guest_restrictions)
     VALUES ($1, $2, $3) RETURNING id`,
    [projectId, userId, restrictionsJson]
  );
  return inserted.id;
}

// PM sets/updates restrictions on what a guest can see.
async function updateMemberRestrictions(projectId, userId, guestRestrictions) {
  const member = await db.queryOne(
    'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );
  if (!member) throw new NotFoundError('Project membership not found');
  await db.query('UPDATE project_members SET guest_restrictions = $1 WHERE id = $2', [
    guestRestrictions ? JSON.stringify(guestRestrictions) : null,
    member.id,
  ]);
}

// PM assigns a whole user group to a project. Each current member of the group
// is also materialised as a project_member so the existing per-user access
// checks keep working without change.
async function assignUserGroup(projectId, userGroupId, addedBy) {
  return db.withTransaction(async (tx) => {
    await getProjectById(projectId);
    const group = await tx.queryOne('SELECT id FROM user_groups WHERE id = $1', [userGroupId]);
    if (!group) throw new NotFoundError('User group not found');

    await tx.query(
      `INSERT INTO project_user_groups (project_id, user_group_id, added_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id, user_group_id) DO NOTHING`,
      [projectId, userGroupId, addedBy]
    );

    const members = await tx.query('SELECT id FROM profiles WHERE user_group_id = $1', [userGroupId]);
    for (const member of members) {
      await tx.query(
        `INSERT INTO project_members (project_id, user_id, guest_restrictions)
         VALUES ($1, $2, NULL)
         ON CONFLICT (project_id, user_id) DO NOTHING`,
        [projectId, member.id]
      );
    }

    return { userGroupId, membersAdded: members.length };
  });
}

async function listProjectUserGroups(projectId) {
  return db.query(
    `SELECT pug.user_group_id, g.name,
            (SELECT COUNT(*) FROM profiles u WHERE u.user_group_id = pug.user_group_id) AS member_count,
            pug.added_at
     FROM project_user_groups pug JOIN user_groups g ON g.id = pug.user_group_id
     WHERE pug.project_id = $1
     ORDER BY g.name`,
    [projectId]
  );
}

async function removeUserGroup(projectId, userGroupId) {
  const link = await db.queryOne(
    'SELECT id FROM project_user_groups WHERE project_id = $1 AND user_group_id = $2',
    [projectId, userGroupId]
  );
  if (!link) throw new NotFoundError('That user group is not assigned to this project.');
  await db.query('DELETE FROM project_user_groups WHERE id = $1', [link.id]);
  // Individual project_members added via the group are intentionally left in place,
  // so removing a group never silently revokes someone's in-progress work access.
}

// A user who isn't yet a member asks to join. Re-requesting after a rejection
// is allowed (resets the same row back to pending); requesting while already
// pending or already a member is rejected with a clear message.
async function createJoinRequest(projectId, requestedBy, message) {
  await getProjectById(projectId);

  const existingMembership = await db.queryOne(
    'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, requestedBy]
  );
  if (existingMembership) throw new ConflictError('You are already a member of this project.');

  const existingRequest = await db.queryOne(
    'SELECT id, status FROM project_join_requests WHERE project_id = $1 AND requested_by = $2',
    [projectId, requestedBy]
  );
  if (existingRequest?.status === 'pending') {
    throw new ConflictError('You already have a pending request for this project.');
  }

  if (existingRequest) {
    return db.queryOne(
      `UPDATE project_join_requests
       SET status = 'pending', message = $1, decided_by = NULL, decided_at = NULL, created_at = now()
       WHERE id = $2
       RETURNING *`,
      [message || null, existingRequest.id]
    );
  }
  return db.queryOne(
    `INSERT INTO project_join_requests (project_id, requested_by, message)
     VALUES ($1, $2, $3) RETURNING *`,
    [projectId, requestedBy, message || null]
  );
}

async function listJoinRequests(projectId) {
  return db.query(
    `SELECT r.id, r.status, r.message, r.created_at, r.decided_at,
            u.id AS user_id, u.name, u.email, u.role
     FROM project_join_requests r JOIN profiles u ON u.id = r.requested_by
     WHERE r.project_id = $1 AND r.status = 'pending'
     ORDER BY r.created_at ASC`,
    [projectId]
  );
}

async function decideJoinRequest(projectId, requestId, { decidedBy, decision }) {
  return db.withTransaction(async (tx) => {
    const request = await tx.queryOne(
      'SELECT * FROM project_join_requests WHERE id = $1 AND project_id = $2',
      [requestId, projectId]
    );
    if (!request) throw new NotFoundError('Join request not found');
    if (request.status !== 'pending') throw new ConflictError('This request has already been decided.');

    if (decision === 'approved') {
      await tx.query(
        `INSERT INTO project_members (project_id, user_id, guest_restrictions)
         VALUES ($1, $2, NULL)
         ON CONFLICT (project_id, user_id) DO NOTHING`,
        [projectId, request.requested_by]
      );
    }

    await tx.query(
      `UPDATE project_join_requests SET status = $1, decided_by = $2, decided_at = now() WHERE id = $3`,
      [decision, decidedBy, requestId]
    );

    return { requestId, status: decision };
  });
}

module.exports = {
  listProjectsForUser,
  getProjectById,
  createProject,
  listMembers,
  addMember,
  updateMemberRestrictions,
  assignUserGroup,
  listProjectUserGroups,
  removeUserGroup,
  createJoinRequest,
  listJoinRequests,
  decideJoinRequest,
};
