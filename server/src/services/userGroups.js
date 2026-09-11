const db = require('../../db/connection');
const { ConflictError, ForbiddenError, NotFoundError } = require('../utils/errors');

// Any active user can browse every group (to discover and request to join) —
// enriched with this viewer's own membership/request state.
async function listUserGroups(viewerId) {
  return db.query(
    `SELECT g.*,
            creator.name AS created_by_name,
            creator.email AS created_by_email,
            (SELECT COUNT(*) FROM profiles p WHERE p.user_group_id = g.id) AS member_count,
            EXISTS (SELECT 1 FROM profiles p WHERE p.user_group_id = g.id AND p.id = $1) AS is_member,
            (
              SELECT r.status FROM user_group_join_requests r
              WHERE r.user_group_id = g.id AND r.requested_by = $1
              ORDER BY r.created_at DESC LIMIT 1
            ) AS join_request_status
     FROM user_groups g
     LEFT JOIN profiles creator ON creator.id = g.created_by
     ORDER BY g.name`,
    [viewerId]
  );
}

// Creating a group is like creating a project: the creator (a PM, or an admin)
// is materialised as its first member too, when their role can hold a group at
// all — admins don't belong to groups, they bypass the concept entirely.
async function createUserGroup({ name, createdBy, creatorRole }) {
  const existing = await db.queryOne('SELECT id FROM user_groups WHERE name = $1', [name]);
  if (existing) throw new ConflictError('A user group with this name already exists.');
  return db.withTransaction(async (tx) => {
    const group = await tx.queryOne(
      'INSERT INTO user_groups (name, created_by) VALUES ($1, $2) RETURNING *',
      [name, createdBy]
    );
    if (['project_manager', 'analyst', 'guest'].includes(creatorRole)) {
      await tx.query('UPDATE profiles SET user_group_id = $1, updated_at = now() WHERE id = $2', [
        group.id,
        createdBy,
      ]);
    }
    return group;
  });
}

// Analysts, guests, and project managers can belong to a group (same rule as
// the assign path in services/users.js), so check it up front for a clear
// message rather than letting the request sit forever un-approvable.
async function createJoinRequest(groupId, requestedBy, requesterRole, message) {
  const group = await db.queryOne('SELECT id FROM user_groups WHERE id = $1', [groupId]);
  if (!group) throw new NotFoundError('User group not found');

  if (!['analyst', 'guest', 'project_manager'].includes(requesterRole)) {
    throw new ForbiddenError('Only analysts, guests, and project managers can join a user group.');
  }

  const profile = await db.queryOne('SELECT user_group_id FROM profiles WHERE id = $1', [requestedBy]);
  if (profile?.user_group_id === groupId) {
    throw new ConflictError('You are already a member of this group.');
  }

  const existingRequest = await db.queryOne(
    'SELECT id, status FROM user_group_join_requests WHERE user_group_id = $1 AND requested_by = $2',
    [groupId, requestedBy]
  );
  if (existingRequest?.status === 'pending') {
    throw new ConflictError('You already have a pending request for this group.');
  }

  if (existingRequest) {
    return db.queryOne(
      `UPDATE user_group_join_requests
       SET status = 'pending', message = $1, decided_by = NULL, decided_at = NULL, created_at = now()
       WHERE id = $2
       RETURNING *`,
      [message || null, existingRequest.id]
    );
  }
  return db.queryOne(
    `INSERT INTO user_group_join_requests (user_group_id, requested_by, message)
     VALUES ($1, $2, $3) RETURNING *`,
    [groupId, requestedBy, message || null]
  );
}

// Admins see every pending request; a project manager only sees requests for
// groups they themselves created — a PM was never meant to decide requests on
// a group they don't own, even though `authorize()` alone can't express that.
async function listJoinRequests(requestingUser) {
  const isAdmin = requestingUser.role === 'admin';
  return db.query(
    `SELECT r.id, r.status, r.message, r.created_at, r.user_group_id,
            g.name AS group_name, g.created_by AS group_created_by,
            u.id AS user_id, u.name, u.email, u.role
     FROM user_group_join_requests r
     JOIN user_groups g ON g.id = r.user_group_id
     JOIN profiles u ON u.id = r.requested_by
     WHERE r.status = 'pending' ${isAdmin ? '' : 'AND g.created_by = $1'}
     ORDER BY r.created_at ASC`,
    isAdmin ? [] : [requestingUser.id]
  );
}

async function decideJoinRequest(requestId, { decidedBy, decidedByRole, decision }) {
  return db.withTransaction(async (tx) => {
    const request = await tx.queryOne(
      `SELECT r.*, g.created_by AS group_created_by
       FROM user_group_join_requests r
       JOIN user_groups g ON g.id = r.user_group_id
       WHERE r.id = $1`,
      [requestId]
    );
    if (!request) throw new NotFoundError('Join request not found');
    if (request.status !== 'pending') throw new ConflictError('This request has already been decided.');

    // Nobody decides their own request — including an admin — and a PM may
    // only decide requests for a group they created themselves, not any group.
    if (request.requested_by === decidedBy) {
      throw new ForbiddenError('You cannot approve or reject your own join request.');
    }
    if (decidedByRole !== 'admin' && request.group_created_by !== decidedBy) {
      throw new ForbiddenError("Only this group's creator or an admin can decide its join requests.");
    }

    if (decision === 'approved') {
      const profile = await tx.queryOne('SELECT role FROM profiles WHERE id = $1', [request.requested_by]);
      if (!profile || !['analyst', 'guest', 'project_manager'].includes(profile.role)) {
        throw new ForbiddenError('Only analysts, guests, and project managers can be assigned to a user group.');
      }
      await tx.query('UPDATE profiles SET user_group_id = $1, updated_at = now() WHERE id = $2', [
        request.user_group_id,
        request.requested_by,
      ]);
    }

    await tx.query(
      `UPDATE user_group_join_requests SET status = $1, decided_by = $2, decided_at = now() WHERE id = $3`,
      [decision, decidedBy, requestId]
    );

    return { requestId, status: decision };
  });
}

module.exports = {
  listUserGroups,
  createUserGroup,
  createJoinRequest,
  listJoinRequests,
  decideJoinRequest,
};
