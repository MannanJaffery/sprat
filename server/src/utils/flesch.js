// FR-FRE 1: Flesch Reading Ease Score (FRES) and Flesch-Kincaid Grade Level (FGL).
// Syllable counting uses the standard vowel-group heuristic (no external dictionary),
// which is the accepted approximation used by most readability tools.

function countSyllables(word) {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!cleaned) return 0;
  const groups = cleaned.match(/[aeiouy]+/g) || [];
  let count = groups.length;
  if (cleaned.endsWith('e') && !cleaned.endsWith('le') && count > 1) count -= 1;
  return Math.max(count, 1);
}

function computeReadability(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    return { wordCount: 0, sentenceCount: 0, syllableCount: 0, fres: null, fgl: null };
  }

  const words = trimmed.match(/[A-Za-z']+/g) || [];
  const sentenceMatches = trimmed.match(/[^.!?]+[.!?]+/g);
  const sentenceCount = sentenceMatches && sentenceMatches.length > 0 ? sentenceMatches.length : 1;
  const wordCount = words.length;
  const syllableCount = words.reduce((sum, word) => sum + countSyllables(word), 0);

  if (wordCount === 0) {
    return { wordCount: 0, sentenceCount, syllableCount: 0, fres: null, fgl: null };
  }

  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = syllableCount / wordCount;

  const fres = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;
  const fgl = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;

  return {
    wordCount,
    sentenceCount,
    syllableCount,
    fres: Math.round(fres * 100) / 100,
    fgl: Math.round(fgl * 100) / 100,
  };
}

module.exports = { computeReadability, countSyllables };
