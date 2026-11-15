// This compares wording within IPC's submission collection. It does not search
// the web, infer who copied whom, or establish a plagiarism finding.
const VERSION = 'ipc-overlap-v1';
const MIN_WORDS = 30;
const MIN_PHRASE_WORDS = 10;
const MIN_DISTINCT_CONTENT_WORDS = 4;
const EXCERPT_LIMIT = 600;
const WORD = /[\p{L}\p{N}][\p{L}\p{M}\p{N}]*(?:['’][\p{L}\p{M}\p{N}]+)*/gu;
const STOP_WORDS = new Set(('a an and are as at be been being but by can could did do does doing for from had has have having he her hers him his how i if in into is it its itself may might more most must my no nor not of on once only or other our ours out over own same shall she should so some such than that the their theirs them themselves then there these they this those through to too under until up us very was we were what when where which while who whom why will with would you your yours also each any all both either neither').split(' '));
const HEADINGS = new Set([
  'executive summary', 'problem definition and scope', 'problem definition',
  'problem statement', 'background and context', 'background', 'context',
  'stakeholder analysis', 'policy options', 'recommended policy',
  'policy recommendation', 'policy recommendations', 'recommendations',
  'anticipated objections', 'implementation', 'implementation plan',
  'evaluation', 'conclusion', 'policy brief', 'references', 'bibliography',
  'works cited', 'literature cited', 'international policy conference', 'ipc',
]);
const REFERENCE_HEADINGS = new Set(['references', 'bibliography', 'works cited', 'literature cited']);

const percent = (part, total) => Math.round(part / total * 10000) / 100;
const boundedInteger = (value, fallback, maximum) => Number.isSafeInteger(value) && value >= 0 ? Math.min(value, maximum) : fallback;

function headingKey(line) {
  return line.normalize('NFKC').trim().replace(/^#{1,6}\s*/, '')
    .replace(/^(?:(?:\d+(?:\.\d+)*|[ivxlcdm]+)[.)\s:\-]+)\s*/i, '')
    .replace(/[:.\s]+$/, '').toLocaleLowerCase('en').replace(/\s+/g, ' ');
}

function mergeExclusions(ranges) {
  ranges.sort((a, b) => a.start - b.start || a.end - b.end);
  const merged = [];
  for (const range of ranges) {
    const previous = merged.at(-1);
    if (previous && range.start <= previous.end) {
      previous.end = Math.max(previous.end, range.end);
      previous.breakSegment ||= range.breakSegment;
    } else merged.push({ ...range });
  }
  return merged;
}

function prepareDocument(value) {
  const text = typeof value === 'string' ? value : '';
  const raw = [];
  for (const match of text.matchAll(WORD)) {
    const normalized = match[0].normalize('NFKC').toLocaleLowerCase('en').replace(/’/g, "'");
    const previous = raw.at(-1);
    // A word split across a PDF line ending should match the unsplit word.
    if (previous && /^[\-\u2010\u2011\u00ad][\t ]*\r?\n[\t ]*$/.test(text.slice(previous.end, match.index))) {
      previous.key += normalized;
      previous.end = match.index + match[0].length;
    } else raw.push({ key: normalized, start: match.index, end: match.index + match[0].length });
  }
  const ranges = [];
  let cutoff = text.length;
  let excludedReferences = false;
  let wordsBeforeLine = 0;
  for (const match of text.matchAll(/[^\r\n]+/g)) {
    const line = match[0];
    const start = match.index;
    while (wordsBeforeLine < raw.length && raw[wordsBeforeLine].start < start) wordsBeforeLine++;
    const key = headingKey(line);
    const normalizedLine = line.normalize('NFKC').trim().toLocaleLowerCase('en').replace(/\s+/g, ' ');
    // An early occurrence of “References” is not enough to discard the rest of
    // an essay. Require a standalone heading after substantial body text.
    if (REFERENCE_HEADINGS.has(key) && start >= text.length * 0.6 &&
      wordsBeforeLine >= MIN_WORDS && wordsBeforeLine >= raw.length * 0.6) {
      cutoff = start;
      excludedReferences = true;
      break;
    }
    const isHeading = line.trim().length <= 100 && HEADINGS.has(key);
    const isCertification = /^(?:i|we) certify that all written work is entirely (?:our|my) own\b/.test(normalizedLine) ||
      /^use of ai language model tools to draft or substantively write any portion of a policy brief is not permitted\b/.test(normalizedLine);
    const isTemplateMetadata = /^this policy brief (?:was |is )?(?:prepared|submitted|written) (?:for|to) (?:the )?(?:international policy conference|ipc)(?:\b|$)/.test(normalizedLine) ||
      /^international policy conference\s+20\d{2}$/.test(normalizedLine) ||
      /^(?:policy category|team(?: name| members)?|student(?: name| names)?|school|institution|submission (?:date|id)|authors?):\s*.{0,160}$/.test(normalizedLine);
    if (isHeading || isCertification || isTemplateMetadata) ranges.push({ start, end: start + line.length, breakSegment: true });
  }
  // Citations and links are not independent evidence of shared original prose.
  for (const match of text.matchAll(/\[\s*\d+(?:\s*[,;\-–]\s*\d+)*\s*\]|\bhttps?:\/\/[^\s<>]+|\b10\.\d{4,9}\/[\w.\-;()/:]+/gu)) {
    if (match.index < cutoff) ranges.push({ start: match.index, end: match.index + match[0].length, breakSegment: false });
  }
  for (const match of text.matchAll(/\([^()\r\n]{1,180}\)/gu)) {
    if (match.index >= cutoff) break;
    const inside = match[0].slice(1, -1).trim();
    const yearOnly = /^(?:19|20)\d{2}[a-z]?$/.test(inside);
    const authorYear = inside.split(/;\s*/).every(citation => {
      const commaForm = /^([\p{Lu}][\p{L}\p{M}'’.&\s-]{0,100}),\s*(?:19|20)\d{2}[a-z]?(?:,\s*(?:p{1,2}\.?\s*)?\d+(?:[–\-]\d+)?)?$/u.exec(citation);
      const shortForm = /^([\p{Lu}][\p{L}\p{M}'’.-]*(?:\s+(?:et\s+al\.?|&\s+[\p{Lu}][\p{L}\p{M}'’.-]*))?)\s+(?:19|20)\d{2}[a-z]?$/u.exec(citation);
      const authors = (commaForm || shortForm)?.[1];
      return !!authors && !STOP_WORDS.has(authors.toLocaleLowerCase('en'));
    });
    if (yearOnly || authorYear) ranges.push({ start: match.index, end: match.index + match[0].length, breakSegment: false });
  }
  const exclusions = mergeExclusions(ranges);
  const tokens = [];
  let current = 0;
  let segment = 0;
  for (const token of raw) {
    if (token.start >= cutoff) break;
    while (current < exclusions.length && exclusions[current].end <= token.start) {
      if (exclusions[current].breakSegment) segment++;
      current++;
    }
    const exclusion = exclusions[current];
    if (exclusion && token.start < exclusion.end && token.end > exclusion.start) continue;
    tokens.push({ ...token, segment });
  }
  return { text, tokens, excludedReferences };
}

function contentBoundary(tokens) {
  // For each endpoint, record the oldest of the four most recently seen
  // distinct content words. A candidate range must contain all four.
  const boundaries = new Int32Array(tokens.length).fill(-1);
  const latest = [];
  let segment = -1;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.segment !== segment) { latest.length = 0; segment = token.segment; }
    if (token.key.length >= 3 && /\p{L}/u.test(token.key) && !STOP_WORDS.has(token.key)) {
      const existing = latest.findIndex(item => item.key === token.key);
      if (existing >= 0) latest.splice(existing, 1);
      latest.push({ key: token.key, position: i });
      if (latest.length > MIN_DISTINCT_CONTENT_WORDS) latest.shift();
    }
    if (latest.length === MIN_DISTINCT_CONTENT_WORDS) boundaries[i] = latest[0].position;
  }
  return boundaries;
}

function suffixAutomaton(tokens) {
  // Unique barriers prevent a match from crossing an excluded section heading.
  const sequence = [];
  let segment = tokens[0]?.segment;
  for (const token of tokens) {
    if (token.segment !== segment) { sequence.push({ key: Symbol('heading') }); segment = token.segment; }
    sequence.push(token);
  }
  const states = [{ length: 0, link: -1, next: new Map(), firstPosition: -1 }];
  let last = 0;
  for (let i = 0; i < sequence.length; i++) {
    const key = sequence[i].key;
    const current = states.length;
    states.push({ length: states[last].length + 1, link: 0, next: new Map(), firstPosition: i });
    let p = last;
    while (p !== -1 && !states[p].next.has(key)) { states[p].next.set(key, current); p = states[p].link; }
    if (p !== -1) {
      const q = states[p].next.get(key);
      if (states[p].length + 1 === states[q].length) states[current].link = q;
      else {
        const clone = states.length;
        states.push({ length: states[p].length + 1, link: states[q].link, next: new Map(states[q].next), firstPosition: states[q].firstPosition });
        while (p !== -1 && states[p].next.get(key) === q) { states[p].next.set(key, clone); p = states[p].link; }
        states[q].link = states[current].link = clone;
      }
    }
    last = current;
  }
  return { states, sequence };
}

function sharedRanges(target, source, boundaries) {
  const { states, sequence } = suffixAutomaton(source.tokens);
  const ranges = [];
  let state = 0;
  let length = 0;
  let segment = -1;
  for (let i = 0; i < target.tokens.length; i++) {
    const token = target.tokens[i];
    if (token.segment !== segment) { state = 0; length = 0; segment = token.segment; }
    while (state !== 0 && !states[state].next.has(token.key)) { state = states[state].link; length = states[state].length; }
    if (states[state].next.has(token.key)) { state = states[state].next.get(token.key); length++; }
    else { state = 0; length = 0; }
    const start = i - length + 1;
    if (length < MIN_PHRASE_WORDS || boundaries[i] < start) continue;
    const sourceEnd = states[state].firstPosition + 1;
    const range = { start, end: i + 1, sourceStart: sourceEnd - length, sourceEnd };
    // A newly found longer phrase makes any contained earlier phrase redundant.
    // Keeping maximal ranges prevents quadratic work on repeated full documents.
    while (ranges.length && ranges.at(-1).start >= range.start) ranges.pop();
    ranges.push(range);
  }
  return { ranges, sourceSequence: sequence };
}

function coverageRanges(ranges) {
  const merged = [];
  for (const range of ranges) {
    const previous = merged.at(-1);
    if (previous && range.start <= previous.end) previous.end = Math.max(previous.end, range.end);
    else merged.push({ start: range.start, end: range.end });
  }
  return merged;
}

function excerpt(text, start, end) {
  if (end - start <= EXCERPT_LIMIT) return { text: text.slice(start, end), end, truncated: false };
  let limit = start + EXCERPT_LIMIT - 1;
  const space = text.lastIndexOf(' ', limit);
  if (space > limit - 70) limit = space;
  if (/[\uD800-\uDBFF]/.test(text[limit - 1])) limit--;
  return { text: `${text.slice(start, limit)}…`, end: limit, truncated: true };
}

function passages(target, source, ranges, sourceSequence, limit) {
  const selected = [];
  for (const range of [...ranges].sort((a, b) => (b.end - b.start) - (a.end - a.start) || a.start - b.start)) {
    if (selected.length >= limit) break;
    if (selected.some(item => item.start < range.end && range.start < item.end)) continue;
    selected.push(range);
  }
  return selected.sort((a, b) => a.start - b.start).map(range => {
    const targetStart = target.tokens[range.start].start;
    const targetEnd = target.tokens[range.end - 1].end;
    const sourceStart = sourceSequence[range.sourceStart].start;
    const sourceEnd = sourceSequence[range.sourceEnd - 1].end;
    const targetExcerpt = excerpt(target.text, targetStart, targetEnd);
    const sourceExcerpt = excerpt(source.text, sourceStart, sourceEnd);
    return { targetText: targetExcerpt.text, sourceText: sourceExcerpt.text,
      targetStart, targetEnd, sourceStart, sourceEnd, wordCount: range.end - range.start,
      excerptTruncated: targetExcerpt.truncated || sourceExcerpt.truncated,
      targetExcerptTruncated: targetExcerpt.truncated, sourceExcerptTruncated: sourceExcerpt.truncated,
      targetExcerptEnd: targetExcerpt.end, sourceExcerptEnd: sourceExcerpt.end };
  });
}

function compareOrder(a, b) {
  return b.sharedWordCount - a.sharedWordCount || String(a.submissionId).localeCompare(String(b.submissionId), 'en');
}

export function analyzeSubmission(targetRow, candidateRows, options = {}) {
  const target = prepareDocument(targetRow?.extractedText);
  const analyzedWords = target.tokens.length;
  const common = { algorithmVersion: VERSION, analyzedAt: new Date().toISOString(),
    excludedReferences: target.excludedReferences, analyzedWords };
  if (analyzedWords < MIN_WORDS) return { ...common, status: 'insufficient_text', comparedCount: 0,
    matchedWordPercent: null, maxPairOverlapPercent: null, matches: [],
    message: 'Not enough readable body text for cross-submission comparison. Manual review is required.' };

  const maxMatches = boundedInteger(options.maxMatches, 20, 50);
  const maxPassages = options.includePassages === false ? 0 : boundedInteger(options.maxPassages, 8, 20);
  const boundaries = contentBoundary(target.tokens);
  const globalCoverage = new Uint8Array(analyzedWords);
  const matches = [];
  const seen = new Set();
  let comparedCount = 0;
  let maxPairWords = 0;
  const candidates = candidateRows && typeof candidateRows[Symbol.iterator] === 'function' ? candidateRows : [];
  for (const row of candidates) {
    if (!row || row === targetRow || typeof row.id !== 'string' || !row.id || row.id === targetRow?.id || seen.has(row.id)) continue;
    seen.add(row.id);
    const source = prepareDocument(row.extractedText);
    if (source.tokens.length < MIN_PHRASE_WORDS) continue;
    comparedCount++;
    const { ranges, sourceSequence } = sharedRanges(target, source, boundaries);
    if (!ranges.length) continue;
    const coverage = coverageRanges(ranges);
    let sharedWordCount = 0;
    for (const range of coverage) {
      sharedWordCount += range.end - range.start;
      globalCoverage.fill(1, range.start, range.end);
    }
    maxPairWords = Math.max(maxPairWords, sharedWordCount);
    const match = { submissionId: row.id, title: String(row.title || 'Untitled submission').slice(0, 240),
      category: String(row.category || '').slice(0, 80), overlapPercent: percent(sharedWordCount, analyzedWords), sharedWordCount };
    if (maxMatches === 0 || (matches.length >= maxMatches && compareOrder(match, matches.at(-1)) >= 0)) continue;
    match.passages = passages(target, source, ranges, sourceSequence, maxPassages);
    matches.push(match);
    matches.sort(compareOrder);
    if (matches.length > maxMatches) matches.pop();
  }
  let coveredWords = 0;
  for (const value of globalCoverage) coveredWords += value;
  return { ...common, status: 'completed', comparedCount,
    matchedWordPercent: percent(coveredWords, analyzedWords), maxPairOverlapPercent: percent(maxPairWords, analyzedWords), matches,
    message: comparedCount === 0
      ? 'No other readable submissions are available yet. Comparison covers IPC submissions only; it does not establish originality.'
      : 'Shared normalized wording within IPC submissions. Standard headings, recognizable citations and late reference sections are excluded. This is not a plagiarism finding or an AI probability.' };
}
