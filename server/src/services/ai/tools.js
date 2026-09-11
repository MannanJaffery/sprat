// Function-calling tools the chatbot can invoke to answer questions about
// real data in the app. Every tool re-checks the requesting user's own
// permissions here (the same rule requireProjectMember() applies to routes),
// so the assistant can never surface more than that user could already see
// through the normal API.
const db = require('../../../db/connection');
const projectsService = require('../projects');
const goalsService = require('../goals');
const { getProjectMembership } = require('../../middleware/projectAccess');

function defineTools() {
  return [
    {
      type: 'function',
      function: {
        name: 'find_projects',
        description:
          "Search projects by name (case-insensitive, partial match) and get each project's id and member count. Use this first to resolve a project name the user mentions into its numeric id before calling any other tool.",
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Text to search project names for. Omit to list recent projects.' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_project_members',
        description:
          "List the individual users directly added as members of a project (name, email, role). Requires the current user to be a member of that project, or an admin — otherwise this returns an access-denied result rather than data.",
        parameters: {
          type: 'object',
          properties: { projectId: { type: 'number', description: 'Numeric project id.' } },
          required: ['projectId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_project_user_groups',
        description:
          'List the user groups assigned to a project and how many users belong to each group. Requires the current user to be a member of that project, or an admin.',
        parameters: {
          type: 'object',
          properties: { projectId: { type: 'number', description: 'Numeric project id.' } },
          required: ['projectId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_project_goal_stats',
        description:
          "Count of goals in a project, broken down by taxonomy category/subtype. Respects the current user's own domain access (a guest only sees goals in domains they're allowed).",
        parameters: {
          type: 'object',
          properties: { projectId: { type: 'number', description: 'Numeric project id.' } },
          required: ['projectId'],
        },
      },
    },
  ];
}

async function findProjects(query) {
  const rows = query
    ? await db.query('SELECT id, name, description FROM projects WHERE name ILIKE $1 ORDER BY name LIMIT 10', [
        `%${query}%`,
      ])
    : await db.query('SELECT id, name, description FROM projects ORDER BY created_at DESC LIMIT 10');

  const projects = await Promise.all(
    rows.map(async (p) => {
      const row = await db.queryOne('SELECT COUNT(*) AS count FROM project_members WHERE project_id = $1', [p.id]);
      return { id: p.id, name: p.name, description: p.description, memberCount: Number(row.count) };
    })
  );
  return { projects };
}

async function getProjectMembers(user, projectId) {
  const membership = await getProjectMembership(projectId, user);
  if (!membership.isMember) {
    return { error: `You do not have access to project #${projectId}'s member list.` };
  }
  const members = await projectsService.listMembers(projectId);
  return { count: members.length, members: members.map((m) => ({ name: m.name, email: m.email, role: m.role })) };
}

async function getProjectUserGroups(user, projectId) {
  const membership = await getProjectMembership(projectId, user);
  if (!membership.isMember) {
    return { error: `You do not have access to project #${projectId}'s user groups.` };
  }
  const groups = await projectsService.listProjectUserGroups(projectId);
  return { userGroups: groups.map((g) => ({ name: g.name, memberCount: Number(g.member_count) })) };
}

async function getProjectGoalStats(user, projectId) {
  const membership = await getProjectMembership(projectId, user);
  if (!membership.isMember) {
    return { error: `You do not have access to project #${projectId}'s goals.` };
  }
  const goals = await goalsService.listGoals(projectId);
  const visible = await goalsService.filterGoalsByDomainAccess(goals, membership);

  const byTaxonomy = {};
  for (const g of visible) {
    const key = `${g.taxonomy_category} / ${g.taxonomy_subtype}`;
    byTaxonomy[key] = (byTaxonomy[key] || 0) + 1;
  }
  return { totalGoals: visible.length, byTaxonomy };
}

async function executeTool(name, args, user) {
  try {
    switch (name) {
      case 'find_projects':
        return await findProjects(args.query);
      case 'get_project_members':
        return await getProjectMembers(user, Number(args.projectId));
      case 'get_project_user_groups':
        return await getProjectUserGroups(user, Number(args.projectId));
      case 'get_project_goal_stats':
        return await getProjectGoalStats(user, Number(args.projectId));
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { error: err.message || 'Tool call failed.' };
  }
}

module.exports = { defineTools, executeTool };
