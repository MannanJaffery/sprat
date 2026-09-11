// Rule-based goal conformance checker — no AI call. A goal statement is short
// enough that a real NLP library (compromise, for tokenizing/POS tagging) plus
// a fixed rule set is more reliable and instant than asking an LLM to judge it.
const nlp = require('compromise');

const AMBIGUOUS_TERMS = [
  'appropriate', 'adequate', 'sufficient', 'reasonable', 'as needed', 'as appropriate',
  'and/or', 'user-friendly', 'robust', 'efficient', 'timely', 'several', 'some', 'many',
  'few', 'normal', 'typical', 'etc', 'etc.', 'if necessary', 'where possible',
  'to the extent possible',
];

const MODAL_PATTERN = /\b(shall|must|should|will|is required to|are required to|needs? to|has to|have to)\b/i;
const PASSIVE_HINT = /\b(is|are|was|were|be|been|being)\s+(\w+ed|\w+en)\b/i;

function findAmbiguousTerms(text) {
  const lower = text.toLowerCase();
  return AMBIGUOUS_TERMS.filter((term) => lower.includes(term));
}

// A goal statement's grammar/conformance report: does it read as an
// enforceable requirement, or as vague, passive, unattributed prose?
function checkGoalGrammar(goal) {
  const description = (goal.description || '').trim();
  const doc = nlp(description);
  const sentenceCount = doc.sentences().length || (description ? 1 : 0);
  const wordCount = doc.terms().length;

  const hasModalVerb = MODAL_PATTERN.test(description);
  const ambiguousTerms = findAmbiguousTerms(description);
  const passiveVoice = PASSIVE_HINT.test(description);
  const hasActor = Boolean(goal.actor && goal.actor.trim());

  const checks = [
    {
      key: 'modal_verb',
      label: 'States an obligation',
      pass: hasModalVerb,
      message: hasModalVerb
        ? 'Uses a clear obligation word (shall/must/should/will).'
        : 'Doesn\'t read as an obligation — consider adding "shall", "must", or "should".',
    },
    {
      key: 'actor',
      label: 'Names a responsible actor',
      pass: hasActor,
      message: hasActor ? `Actor recorded: ${goal.actor}.` : 'No actor recorded — who is responsible for this?',
    },
    {
      key: 'ambiguous_terms',
      label: 'Avoids vague language',
      pass: ambiguousTerms.length === 0,
      message: ambiguousTerms.length
        ? `Contains vague term(s): ${ambiguousTerms.join(', ')}.`
        : 'No classically vague requirement words detected.',
    },
    {
      key: 'passive_voice',
      label: 'Active voice',
      pass: !passiveVoice,
      message: passiveVoice
        ? 'Reads as passive voice — consider naming who performs the action.'
        : 'Reads as active voice.',
    },
    {
      key: 'single_statement',
      label: 'One clear statement',
      pass: sentenceCount <= 2,
      message:
        sentenceCount <= 2
          ? 'Stated as a single, focused statement.'
          : `Reads as ${sentenceCount} sentences — consider splitting into separate goals.`,
    },
    {
      key: 'length',
      label: 'Reasonable length',
      pass: wordCount >= 5 && wordCount <= 45,
      message:
        wordCount < 5
          ? 'Very short — may be missing detail (condition, object, or actor).'
          : wordCount > 45
          ? 'Quite long — consider whether this is really more than one goal.'
          : `${wordCount} words — a reasonable length.`,
    },
  ];

  const passCount = checks.filter((c) => c.pass).length;
  const score = Math.round((passCount / checks.length) * 100);
  const verdict = score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Needs work' : 'Poor';

  return { wordCount, sentenceCount, score, verdict, checks };
}

module.exports = { checkGoalGrammar };
