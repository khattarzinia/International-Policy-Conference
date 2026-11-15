import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { analyzeSubmission } from '../lib/similarity.js';

const words = (prefix, count, start = 0) => Array.from({ length: count }, (_, i) => `${prefix}${i + start}`);
const row = (id, text, extra = {}) => ({ id, title: `Brief ${id}`, category: 'Education', extractedText: text, ...extra });
const text = (prefix, count, start = 0) => words(prefix, count, start).join(' ');
const analyze = (target, candidates, options) => analyzeSubmission(row('target', target), candidates.map((value, i) => typeof value === 'string' ? row(`source-${i}`, value) : value), options);

test('an exact copy has full target-body coverage and raw evidence offsets', () => {
  const brief = text('education', 65);
  const result = analyze(brief, [brief]);
  assert.equal(result.status, 'completed');
  assert.equal(result.algorithmVersion, 'ipc-overlap-v1');
  assert.equal(result.comparedCount, 1);
  assert.equal(result.analyzedWords, 65);
  assert.equal(result.matchedWordPercent, 100);
  assert.equal(result.maxPairOverlapPercent, 100);
  assert.equal(result.matches[0].sharedWordCount, 65);
  const passage = result.matches[0].passages[0];
  assert.equal(passage.wordCount, 65);
  assert.equal(passage.targetStart, 0);
  assert.equal(passage.targetEnd, brief.length);
  assert.equal(passage.sourceStart, 0);
  assert.equal(passage.sourceEnd, brief.length);
  assert.equal(passage.excerptTruncated, true);
  assert.ok(passage.targetText.length <= 600);
});

test('a copied paragraph reports the fraction of target words rather than source words', () => {
  const copied = text('transit', 20);
  const target = `${text('targetintro', 10)}\n\n${copied}\n\n${text('targetending', 10)}`;
  const source = `${text('sourceintro', 60)} ${copied} ${text('sourceending', 20)}`;
  const result = analyze(target, [source]);
  assert.equal(result.matchedWordPercent, 50);
  assert.equal(result.matches[0].overlapPercent, 50);
  assert.equal(result.matches[0].sharedWordCount, 20);
  const passage = result.matches[0].passages[0];
  assert.equal(target.slice(passage.targetStart, passage.targetEnd), copied);
  assert.equal(source.slice(passage.sourceStart, passage.sourceEnd), copied);
  assert.equal(passage.targetText, copied);
  assert.equal(passage.sourceText, copied);
});

test('essays on the same topic without shared phrasing do not produce a match', () => {
  const target = 'Public transport policy should prioritise affordable access for students in rural communities. Our evidence examines bus timetables, household travel costs, school attendance records, and the distribution of services between villages. A targeted subsidy offers the most feasible intervention within the available municipal budget.';
  const source = 'Students living outside cities face difficult journeys when local buses run infrequently. To address educational inequality, this proposal evaluates fare reductions alongside expanded route coverage. Municipal leaders should compare attendance outcomes and transport expenditure using a pilot programme before committing to permanent financial support.';
  const result = analyze(target, [source]);
  assert.equal(result.comparedCount, 1);
  assert.equal(result.matchedWordPercent, 0);
  assert.deepEqual(result.matches, []);
});

test('case, Unicode whitespace, punctuation and hyphen variants normalize without losing raw offsets', () => {
  const shared = 'Evidence based transport investment improves neighbourhood access through reliable affordable public services and accountable municipal oversight';
  const target = `${text('intro', 10)}\nEVIDENCE–BASED\u00a0TRANSPORT\u2003INVESTMENT improves neighbourhood access through reliable affordable public services and accountable municipal oversight\n${text('ending', 10)}`;
  const source = `${text('source', 10)} ${shared} ${text('last', 10)}`;
  const result = analyze(target, [source]);
  assert.equal(result.matches[0].sharedWordCount, 16);
  const passage = result.matches[0].passages[0];
  assert.equal(passage.targetText, target.slice(passage.targetStart, passage.targetEnd));
  assert.equal(passage.sourceText, shared);
});

test('PDF words broken across a hyphenated line ending match unsplit words', () => {
  const body = 'Local government accountability requires published expenditure records independent annual audits meaningful resident participation transparent procurement systems and reliable delivery standards';
  const target = `${text('preface', 10)} ${body.replace('government', 'govern-\nment')} ${text('ending', 10)}`;
  const result = analyze(target, [`${text('different', 10)} ${body} ${text('other', 10)}`]);
  assert.equal(result.matches[0].sharedWordCount, 20);
  assert.match(result.matches[0].passages[0].targetText, /govern-\nment/);
});

test('multiple sources use union coverage rather than adding overlapping percentages', () => {
  const targetWords = words('climate', 100);
  const target = targetWords.join(' ');
  const result = analyze(target, [
    `${text('one', 10)} ${targetWords.slice(10, 50).join(' ')} ${text('two', 10)}`,
    `${text('three', 10)} ${targetWords.slice(30, 70).join(' ')} ${text('four', 10)}`,
  ]);
  assert.equal(result.matchedWordPercent, 60);
  assert.equal(result.maxPairOverlapPercent, 40);
  assert.equal(result.matches.length, 2);
  assert.equal(result.matches[0].sharedWordCount, 40);
});

test('late references are excluded from both the target denominator and source matches', () => {
  const bibliography = text('referencesource', 18);
  const target = `${text('originalargument', 60)}\n\nReferences\n${bibliography}`;
  const source = `${text('differentargument', 60)}\n\nBibliography\n${bibliography}`;
  const result = analyze(target, [source]);
  assert.equal(result.excludedReferences, true);
  assert.equal(result.analyzedWords, 60);
  assert.equal(result.matchedWordPercent, 0);
  assert.equal(result.matches.length, 0);
});

test('an early standalone References heading does not discard subsequent body text', () => {
  const body = text('argument', 65);
  const result = analyze(`References\n${body}`, [body]);
  assert.equal(result.excludedReferences, false);
  assert.equal(result.analyzedWords, 65);
  assert.equal(result.matchedWordPercent, 100);
});

test('a standalone References heading around forty percent does not suppress the remaining argument', () => {
  const opening = text('opening', 40);
  const ending = text('continuedargument', 60);
  const target = `${opening}\nReferences\n${ending}`;
  const result = analyze(target, [ending]);
  assert.equal(result.excludedReferences, false);
  assert.equal(result.analyzedWords, 100);
  assert.equal(result.matchedWordPercent, 60);
});

test('the word references inside a sentence cannot truncate the document', () => {
  const body = `${text('opening', 35)} The evidence references studies from several independent research organisations before explaining their limitations. ${text('ending', 25)}`;
  const result = analyze(body, [body]);
  assert.equal(result.excludedReferences, false);
  assert.equal(result.matchedWordPercent, 100);
});

test('standard IPC headings and certifications alone cannot inflate similarity', () => {
  const common = '\nInternational Policy Conference 2027\nThis policy brief was prepared for the International Policy Conference.\nPolicy category: Education\nTeam name: Education Policy Team\n1. Executive Summary\n2. Problem Definition and Scope\n3. Background and Context\n4. Stakeholder Analysis\n5. Policy Options\n6. Recommended Policy\n7. Anticipated Objections\nI certify that all written work is entirely our own.\n';
  const result = analyze(`${common}${text('targetargument', 45)}`, [`${common}${text('sourceargument', 45)}`]);
  assert.equal(result.analyzedWords, 45);
  assert.equal(result.matchedWordPercent, 0);
  assert.deepEqual(result.matches, []);
});

test('matching cannot jump across an excluded section heading', () => {
  const first = text('beforeheading', 8);
  const second = text('afterheading', 8);
  const target = `${text('targetstart', 20)} ${first}\nExecutive Summary\n${second} ${text('targetend', 20)}`;
  const source = `${text('sourcestart', 20)} ${first} ${second} ${text('sourceend', 20)}`;
  const result = analyze(target, [source]);
  assert.equal(result.matchedWordPercent, 0);
  const reversed = analyze(source, [target]);
  assert.equal(reversed.matchedWordPercent, 0);
});

test('recognizable inline citations and links do not contribute eligible words', () => {
  const body = text('body', 40);
  const target = `${body} (Smith et al., 2024) [1, 2–4] https://example.org/a-report`;
  const source = `${body} (Jones, 2023) [9] https://different.example/report`;
  const result = analyze(target, [source]);
  assert.equal(result.analyzedWords, 40);
  assert.equal(result.matchedWordPercent, 100);
});

test('ordinary numerical explanations in parentheses remain body text', () => {
  for (const sentence of ['an increase of twenty percent since 2020', 'An increase of twenty percent since 2020', 'The programme began in 2020']) {
    const target = `${text('argument', 35)} (${sentence}) ${text('ending', 10)}`;
    const result = analyze(target, []);
    assert.equal(result.analyzedWords, 45 + sentence.split(' ').length);
  }
});

test('stopword-only shared phrases do not create matches', () => {
  const common = 'the and of to for in on with from our their this that is are was were will would should can could may might';
  const result = analyze(`${text('original', 35)} ${common}`, [`${text('different', 35)} ${common}`]);
  assert.equal(result.matchedWordPercent, 0);
  assert.deepEqual(result.matches, []);
});

test('short or image-only text requires manual comparison rather than a clean zero score', () => {
  for (const brief of ['', 'Executive Summary\nProblem Definition and Scope', text('short', 20)]) {
    const result = analyze(brief, [text('source', 50)]);
    assert.equal(result.status, 'insufficient_text');
    assert.equal(result.matchedWordPercent, null);
    assert.equal(result.maxPairOverlapPercent, null);
    assert.deepEqual(result.matches, []);
  }
});

test('self, duplicate candidate IDs, and unreadable sources are not counted twice', () => {
  const target = row('self', text('argument', 60));
  const result = analyzeSubmission(target, [target, { ...target }, row('source', target.extractedText), row('source', target.extractedText), row('unreadable', '')]);
  assert.equal(result.comparedCount, 1);
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0].submissionId, 'source');
});

test('no other readable submissions is explicitly reported as collection scope', () => {
  const result = analyze(text('original', 45), []);
  assert.equal(result.status, 'completed');
  assert.equal(result.comparedCount, 0);
  assert.equal(result.matchedWordPercent, 0);
  assert.match(result.message, /No other readable submissions/);
  assert.match(result.message, /does not establish originality/);
});

test('every supplied candidate contributes coverage even when only top matches are returned', () => {
  const targetWords = words('shared', 300);
  const candidates = Array.from({ length: 25 }, (_, i) => row(`source-${i.toString().padStart(2, '0')}`, targetWords.slice(i * 12, i * 12 + 12).join(' ')));
  const result = analyze(targetWords.join(' '), candidates);
  assert.equal(result.comparedCount, 25);
  assert.equal(result.matches.length, 20);
  assert.equal(result.matchedWordPercent, 100);
  assert.equal(result.maxPairOverlapPercent, 4);
});

test('summary-only analysis computes complete coverage without exporting source IDs or passages', () => {
  const target = text('shared', 60);
  const result = analyze(target, [target], { maxMatches: 0, includePassages: false });
  assert.equal(result.matchedWordPercent, 100);
  assert.equal(result.maxPairOverlapPercent, 100);
  assert.deepEqual(result.matches, []);
});

test('older and newest supplied candidates are both compared without a latest-entry cutoff', () => {
  const target = text('shared', 60);
  const candidates = Array.from({ length: 505 }, (_, i) => row(`older-${i}`, text(`uniquebrief${i}word`, 35)));
  candidates[0].extractedText = target;
  candidates.push(row('newest', target));
  const result = analyze(target, candidates);
  assert.equal(result.comparedCount, 506);
  assert.equal(result.matches.length, 2);
  assert.deepEqual(new Set(result.matches.map(item => item.submissionId)), new Set(['older-0', 'newest']));
  assert.equal(result.matchedWordPercent, 100);
});

test('passage display limits preserve full raw offsets and complete coverage', () => {
  const shared = text('copiedphrase', 30);
  const target = `${text('original', 15)} ${shared} ${text('middle', 15)} ${text('secondcopy', 30)}`;
  const source = `${text('other', 15)} ${shared} ${text('different', 15)} ${text('secondcopy', 30)}`;
  const result = analyze(target, [source], { maxPassages: 1 });
  assert.equal(result.matches[0].passages.length, 1);
  assert.equal(result.matches[0].sharedWordCount, 60);
  assert.equal(result.matchedWordPercent, 66.67);
});

test('a nontruncated excerpt is an exact raw slice, including Unicode offsets', () => {
  const copied = 'Municipal education funding supports reliable transport services equitable participation independent evaluation accessible facilities and transparent budget oversight';
  const target = `🎓 ${text('preface', 10)}\n${copied}\n${text('ending', 10)}`;
  const source = `🌏 ${text('intro', 10)}\n${copied}\n${text('last', 10)}`;
  const result = analyze(target, [source]);
  const passage = result.matches[0].passages[0];
  assert.equal(passage.excerptTruncated, false);
  assert.equal(target.slice(passage.targetStart, passage.targetEnd), copied);
  assert.equal(source.slice(passage.sourceStart, passage.sourceEnd), copied);
  assert.equal(passage.targetText, copied);
});

test('each repeated occurrence in the target is covered even when the source has only one', () => {
  const copied = text('sharedparagraph', 30);
  const target = `${copied} ${text('originalargument', 20)} ${copied}`;
  const result = analyze(target, [copied]);
  assert.equal(result.matches[0].sharedWordCount, 60);
  assert.equal(result.matchedWordPercent, 75);
  assert.equal(result.matches[0].passages.length, 2);
});

function bruteCoverage(targetWords, sourceWords, minimum = 10) {
  const covered = new Uint8Array(targetWords.length);
  for (let i = 0; i < targetWords.length; i++) {
    for (let j = 0; j < sourceWords.length; j++) {
      let length = 0;
      while (i + length < targetWords.length && j + length < sourceWords.length && targetWords[i + length] === sourceWords[j + length]) length++;
      if (length >= minimum && new Set(targetWords.slice(i, i + length)).size >= 4) covered.fill(1, i, i + length);
    }
  }
  return Math.round(covered.reduce((a, b) => a + b, 0) / targetWords.length * 10000) / 100;
}

test('the bounded matching algorithm agrees with exhaustive coverage on repeated randomized sequences', () => {
  let seed = 19;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed; };
  const vocabulary = ['transport', 'funding', 'schools', 'housing', 'healthcare', 'equity'];
  for (let run = 0; run < 50; run++) {
    const target = Array.from({ length: 55 }, () => vocabulary[random() % vocabulary.length]);
    const source = Array.from({ length: 60 }, () => vocabulary[random() % vocabulary.length]);
    if (run % 2) source.splice(12, 15, ...target.slice(20, 35));
    const actual = analyze(target.join(' '), [source.join(' ')]);
    assert.equal(actual.matchedWordPercent, bruteCoverage(target, source), `run ${run}`);
  }
});

test('large sparse collections and highly repeated wording finish without quadratic posting expansion', () => {
  const target = `${text('target', 1400)} ${text('shared', 100)}`;
  const candidates = Array.from({ length: 120 }, (_, i) => row(`source-${i}`, `${text(`source${i}word`, 1400)} ${i === 119 ? text('shared', 100) : text(`ending${i}word`, 100)}`));
  const sparseStart = performance.now();
  const sparse = analyze(target, candidates, { includePassages: false });
  const sparseMs = performance.now() - sparseStart;
  assert.equal(sparse.comparedCount, 120);
  assert.equal(sparse.matches.length, 1);
  assert.equal(sparse.matches[0].sharedWordCount, 100);
  const repeated = Array.from({ length: 6000 }, (_, i) => ['transport', 'funding', 'schools', 'housing', 'healthcare'][i % 5]).join(' ');
  const repeatedStart = performance.now();
  const checked = analyze(repeated, Array.from({ length: 10 }, (_, i) => row(`repeat-${i}`, repeated)), { includePassages: false });
  const repeatedMs = performance.now() - repeatedStart;
  assert.equal(checked.matchedWordPercent, 100);
  assert.ok(sparseMs < 15000, `sparse comparison took ${sparseMs.toFixed(0)}ms`);
  assert.ok(repeatedMs < 15000, `repeated comparison took ${repeatedMs.toFixed(0)}ms`);
  console.log(`Similarity benchmark: 120 ×1500-word candidates ${sparseMs.toFixed(0)}ms; 10 ×6000-word repeated candidates ${repeatedMs.toFixed(0)}ms.`);
});

test('repeated common-heading templates across a hundred briefs do not create matches', () => {
  const headings = ['Executive Summary', 'Problem Definition and Scope', 'Background and Context', 'Stakeholder Analysis', 'Policy Options', 'Recommended Policy', 'Anticipated Objections', 'Conclusion'];
  const template = prefix => headings.map((heading, i) => `${heading}\n${text(`${prefix}section${i}word`, 30)}`).join('\n\n');
  const result = analyze(template('target'), Array.from({ length: 100 }, (_, i) => row(`source-${i}`, template(`source${i}`))));
  assert.equal(result.comparedCount, 100);
  assert.equal(result.analyzedWords, 240);
  assert.equal(result.matchedWordPercent, 0);
  assert.deepEqual(result.matches, []);
});
