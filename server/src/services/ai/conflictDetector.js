const { chatCompletion } = require('./groqClient');
const { ApiError } = require('../../utils/errors');

// Keeps prompt size (and cost) bounded on very large projects — conflicts are
// most useful within a working set an analyst is actively reconciling anyway.
const MAX_GOALS = 80;

function buildGoalLines(goals) {
  return goals
    .map(
      (g) =>
        `#${g.id} [${g.goal_code}] (${g.taxonomy_category}/${g.taxonomy_subtype}, actor: ${
          g.actor || 'unspecified'
        }) ${g.description}`
    )
    .join('\n');
}

const SYSTEM_PROMPT = `You are a requirements-analysis assistant. You will be given a list of security/privacy goals extracted from policy documents in one project, each prefixed with a numeric id like "#12". Identify pairs of goals that genuinely CONTRADICT or CONFLICT with each other — for example: different retention periods for the same kind of data, one goal permitting something another forbids, or incompatible access/handling rules for the same actor and data. Do not flag goals that are merely about different topics, or that are complementary rather than contradictory.

Respond ONLY with strict JSON of this shape:
{"conflicts": [{"goalAId": <number>, "goalBId": <number>, "severity": "low"|"medium"|"high", "explanation": "one or two plain-English sentences"}]}

Use only the numeric ids given after each "#". If there are no real conflicts, return {"conflicts": []}.`;

async function detectConflicts(goals) {
  if (goals.length < 2) return { checked: goals.length, truncated: false, conflicts: [] };

  const truncated = goals.length > MAX_GOALS;
  const workingSet = truncated ? goals.slice(0, MAX_GOALS) : goals;

  const raw = await chatCompletion({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildGoalLines(workingSet) },
    ],
    jsonMode: true,
    temperature: 0.2,
    maxTokens: 1400,
  });

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ApiError(502, 'The AI provider returned a response that could not be parsed.');
  }

  const byId = Object.fromEntries(workingSet.map((g) => [g.id, g]));
  const rawConflicts = Array.isArray(parsed.conflicts) ? parsed.conflicts : [];

  const conflicts = rawConflicts
    .filter(
      (c) =>
        byId[c.goalAId] &&
        byId[c.goalBId] &&
        c.goalAId !== c.goalBId
    )
    .map((c) => ({
      goalA: {
        id: byId[c.goalAId].id,
        goalCode: byId[c.goalAId].goal_code,
        description: byId[c.goalAId].description,
      },
      goalB: {
        id: byId[c.goalBId].id,
        goalCode: byId[c.goalBId].goal_code,
        description: byId[c.goalBId].description,
      },
      severity: ['low', 'medium', 'high'].includes(c.severity) ? c.severity : 'medium',
      explanation: String(c.explanation || '').slice(0, 500),
    }));

  return { checked: workingSet.length, truncated, conflicts };
}

module.exports = { detectConflicts };
