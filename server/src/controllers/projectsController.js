const asyncHandler = require('../utils/asyncHandler');
const projectsService = require('../services/projects');

const list = asyncHandler(async (req, res) => {
  res.json(projectsService.listProjectsForUser(req.user));
});

const getOne = asyncHandler(async (req, res) => {
  res.json(projectsService.getProjectById(req.params.projectId));
});

const create = asyncHandler(async (req, res) => {
  const project = projectsService.createProject({
    name: req.body.name,
    description: req.body.description,
    createdBy: req.user.id,
  });
  res.locals.audit({ action: 'create', objectType: 'project', objectId: project.id });
  res.status(201).json(project);
});

const listMembers = asyncHandler(async (req, res) => {
  res.json(projectsService.listMembers(req.params.projectId));
});

// FR-UA 2e/2f: assign a user (and, for guests, their domain restrictions) to a project.
const addMember = asyncHandler(async (req, res) => {
  const memberId = projectsService.addMember(req.params.projectId, {
    userId: req.body.userId,
    guestRestrictions: req.body.guestRestrictions,
  });
  res.locals.audit({ action: 'update', objectType: 'project_member', objectId: memberId });
  res.status(201).json({ id: memberId });
});

const updateMemberRestrictions = asyncHandler(async (req, res) => {
  projectsService.updateMemberRestrictions(
    req.params.projectId,
    req.params.userId,
    req.body.guestRestrictions
  );
  res.locals.audit({ action: 'update', objectType: 'project_member', objectId: Number(req.params.userId) });
  res.status(204).send();
});

module.exports = { list, getOne, create, listMembers, addMember, updateMemberRestrictions };
