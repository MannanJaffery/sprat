const { chatMessage } = require('./groqClient');
const { defineTools, executeTool } = require('./tools');
const { ApiError } = require('../../utils/errors');

const ROLE_BLURBS = {
  admin: 'They are an Admin: full oversight of every project, user approvals, and access control — nothing in the app is off-limits to them.',
  project_manager: 'They are a Project Manager: they own projects end to end — documents, domains, team membership, and incoming join requests.',
  analyst: 'They are an Analyst: they mine goals out of policy text, classify them against the taxonomy, and build out scenarios.',
  guest: 'They are a Guest: read-only access, scoped to specific domains within whichever projects they were added to.',
};

const BASE_PROMPT = `You are the in-app assistant for SPRAT (Security & Privacy Requirements Analysis Tool) — a workspace where teams mine security/privacy goals out of policy documents, classify them against a taxonomy, reconcile independent analysts' classifications, model usage scenarios, trace goals back to the policies and scenarios they appear in, and keep an append-only audit trail.

Answer questions about how to use SPRAT, its workflow, and general privacy/security requirements-engineering concepts (goals, obligations, classification, reconciliation, GDPR/HIPAA/CCPA-style regulation). Be concise and concrete — a sentence or two, or a short numbered list for steps.

You also have tools that read this app's real backend data (projects, their members, their assigned user groups, goal counts) — use them whenever the user asks about specific projects, members, user groups, or goal counts, rather than saying you don't have that information. If the user names a project, call find_projects first to resolve its id, then call the tool that answers their question with that id. Every tool already enforces this user's own access — if a tool comes back with an "error" field, tell the user plainly that they don't have access to that; don't guess or invent an answer instead. Never invent specific data you were not given by a tool or by the conversation. If asked something with no connection to this app or to privacy/security requirements analysis, say briefly that it's outside what you can help with here.`;

const MAX_HISTORY_MESSAGES = 16;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_TOOL_ROUNDS = 4;

function buildSystemPrompt({ user, project }) {
  const roleBlurb = ROLE_BLURBS[user?.role] || '';
  const projectLine = project
    ? `They are currently viewing the project "${project.name}" (id: ${project.id}).`
    : 'They are not currently inside a specific project.';
  return `${BASE_PROMPT}\n\n${roleBlurb} ${projectLine}\nThe user's name is ${user?.name || 'there'}.`;
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) throw new ApiError(400, 'history must be an array.');
  const trimmed = history.slice(-MAX_HISTORY_MESSAGES);
  return trimmed.map((m) => {
    if (!m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string') {
      throw new ApiError(400, 'Each message needs a role of "user" or "assistant" and string content.');
    }
    return { role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) };
  });
}

async function converse({ user, project, history }) {
  const messages = [
    { role: 'system', content: buildSystemPrompt({ user, project }) },
    ...sanitizeHistory(history),
  ];
  const tools = defineTools();

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const message = await chatMessage({ messages, tools, temperature: 0.3, maxTokens: 700 });

    if (!message.tool_calls?.length) {
      return message.content || "I couldn't come up with a reply to that — try rephrasing?";
    }

    messages.push({ role: 'assistant', content: message.content || null, tool_calls: message.tool_calls });

    for (const call of message.tool_calls) {
      let args = {};
      try {
        args = JSON.parse(call.function.arguments || '{}');
      } catch {
        args = {};
      }
      const result = await executeTool(call.function.name, args, user);
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }

  // Ran out of tool-call rounds — force a final plain-text answer.
  const finalMessage = await chatMessage({ messages, temperature: 0.3, maxTokens: 500 });
  return finalMessage.content || "I couldn't finish that lookup — try asking more specifically.";
}

module.exports = { converse };
