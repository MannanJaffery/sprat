const db = require('../../db/connection');
const { ForbiddenError, NotFoundError } = require('../utils/errors');

// NFR1: differentiated, project-scoped access. Admins bypass project membership checks;
// every other role must be an explicit member of the project to see anything inside it.
// Guests carry an additional guest_restrictions allow-list of domain_ids (null = unrestricted
// within the project, but guests are still read-only — enforced by route-level `authorize`).
function requireProjectMember(paramName = 'projectId') {
  return (req, res, next) => {
    const projectId = Number(req.params[paramName]);
    if (!projectId) return next(new NotFoundError('Project not found'));

    const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId);
    if (!project) return next(new NotFoundError('Project not found'));

    if (req.user.role === 'admin') {
      req.projectMembership = { restricted: false, allowedDomainIds: null };
      return next();
    }

    const membership = db
      .prepare('SELECT guest_restrictions FROM project_members WHERE project_id = ? AND user_id = ?')
      .get(projectId, req.user.id);

    if (!membership) {
      return next(new ForbiddenError('You are not assigned to this project.'));
    }

    let allowedDomainIds = null;
    if (req.user.role === 'guest' && membership.guest_restrictions) {
      try {
        allowedDomainIds = JSON.parse(membership.guest_restrictions);
      } catch {
        allowedDomainIds = [];
      }
    }

    req.projectMembership = {
      restricted: req.user.role === 'guest' && Array.isArray(allowedDomainIds),
      allowedDomainIds,
    };
    next();
  };
}

function assertDomainAllowed(req, domainId) {
  const { restricted, allowedDomainIds } = req.projectMembership || {};
  if (!restricted) return;
  if (domainId == null || !allowedDomainIds.includes(domainId)) {
    throw new ForbiddenError('This item is outside your assigned domain access.');
  }
}

module.exports = { requireProjectMember, assertDomainAllowed };
