const { chatCompletion } = require('./groqClient');

function groupByTaxonomy(goals) {
  const map = {};
  for (const g of goals) {
    const key = `${g.taxonomy_category} / ${g.taxonomy_subtype}`;
    (map[key] = map[key] || []).push(g);
  }
  return map;
}

function buildGoalDigest(goals) {
  const grouped = groupByTaxonomy(goals);
  return Object.entries(grouped)
    .map(
      ([category, group]) =>
        `${category} (${group.length}):\n` +
        group
          .slice(0, 25)
          .map((g) => `- [${g.goal_code}] ${g.description}${g.relevant_legislation ? ` (ref: ${g.relevant_legislation})` : ''}`)
          .join('\n')
    )
    .join('\n\n');
}

async function generateProjectSummary(project, goals) {
  if (goals.length === 0) {
    return {
      summary: 'No goals have been recorded in this project yet, so there is nothing to summarize.',
      goalCount: 0,
    };
  }

  const messages = [
    {
      role: 'system',
      content: `You are a privacy/security requirements analyst writing a short executive summary for a project called "${project.name}". You are given the goals recorded so far, grouped by taxonomy. Write a concise summary (max ~220 words) covering: (1) the overall shape of what this project's policies commit to, (2) the most notable or high-stakes obligations, (3) any gaps or thin areas worth an analyst's attention (e.g. very few goals in a category you'd expect more in). Plain prose in short paragraphs, no headers, no bullet lists, professional tone. Do not invent obligations that are not in the data given to you.`,
    },
    { role: 'user', content: buildGoalDigest(goals) },
  ];

  const summary = await chatCompletion({ messages, temperature: 0.4, maxTokens: 500 });
  return { summary, goalCount: goals.length };
}

module.exports = { generateProjectSummary };
