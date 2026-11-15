import { analyzeSubmission } from './similarity.js';

export async function compareStoredSubmission(store, id, options = {}) {
  const target = await store.get(id);
  if (!target) return null;
  const rows = await store.comparisonRows();
  const comparison = analyzeSubmission(target, rows, options);
  comparison.corpusTotal = rows.filter(row => row.id !== id).length;
  await store.update(id, { comparisonSummary: {
    status: comparison.status, algorithmVersion: comparison.algorithmVersion,
    matchedWordPercent: comparison.matchedWordPercent, maxPairOverlapPercent: comparison.maxPairOverlapPercent,
    comparedCount: comparison.comparedCount, analyzedAt: comparison.analyzedAt,
    analyzedWords: comparison.analyzedWords, excludedReferences: comparison.excludedReferences,
    corpusTotal: comparison.corpusTotal,
  } });
  // Matching passages belong only in authenticated review responses. Keep the
  // stored summary small and never place other entrants' text in public receipts.
  return comparison;
}
