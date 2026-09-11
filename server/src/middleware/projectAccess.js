const db = require('../../db/connection');
const { ForbiddenError, NotFoundError } = require('../utils/errors');

// The core access rule, factored out so anything outside the route pipeline
// (the AI assistant's tool calls, in particular) can apply the exact same
// check a request would get from requireProjectMember() below.
async function getProjectMembership(projectId, user) {
  const project = await db.queryOne('SELECT id FROM projects WHERE id = $1', [projectId]);
  if (!project) throw new NotFoundError('Project not found');

  if (user.role === 'admin') {
    return { isMember: true, restricted: false, allowedDomainIds: null };
  }

  const membership = await db.queryOne(
    'SELECT guest_restrictions FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, user.id]
  );
  if (!membership) {
    return { isMember: false, restricted: false, allowedDomainIds: null };
  }

  let allowedDomainIds = null;
  if (user.role === 'guest' && membership.guest_restrictions) {
    try {
      allowedDomainIds = JSON.parse(membership.guest_restrictions);
    } catch {
      allowedDomainIds = [];
    }
  }

  return {
    isMember: true,
    restricted: user.role === 'guest' && Array.isArray(allowedDomainIds),
    allowedDomainIds,
  };
}

// Differentiated, project-scoped access. Admins bypass project membership checks;
// every other role must be an explicit member of the project to see anything inside it.
// Guests carry an additional guest_restrictions allow-list of domain_ids (null = unrestricted
// within the project, but guests are still read-only — enforced by route-level `authorize`).
function requireProjectMember(paramName = 'projectId') {
  return async (req, res, next) => {
    try {
      const projectId = Number(req.params[paramName]);
      if (!projectId) return next(new NotFoundError('Project not found'));

      const membership = await getProjectMembership(projectId, req.user);
      if (!membership.isMember) {
        return next(new ForbiddenError('You are not assigned to this project.'));
      }

      req.projectMembership = { restricted: membership.restricted, allowedDomainIds: membership.allowedDomainIds };
      next();
    } catch (err) {
      next(err);
    }
  };
}

function assertDomainAllowed(req, domainId) {
  const { restricted, allowedDomainIds } = req.projectMembership || {};
  if (!restricted) return;
  if (domainId == null || !allowedDomainIds.includes(domainId)) {
    throw new ForbiddenError('This item is outside your assigned domain access.');
  }
}

module.exports = { requireProjectMember, assertDomainAllowed, getProjectMembership };
