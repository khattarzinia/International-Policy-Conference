export function detectorSettings(env) {
  const provider = env.IPC_AI_PROVIDER || 'gptzero';
  const key = provider === 'gptzero' ? env.GPTZERO_API_KEY : provider === 'sapling' ? env.SAPLING_API_KEY : null;
  const dailyLimit = Math.max(0, Math.min(10000, Number.parseInt(env.IPC_MAX_SCANS_PER_DAY || '0', 10) || 0));
  return { provider, label: provider === 'sapling' ? 'Sapling' : 'GPTZero', key, dailyLimit,
    enabled: env.IPC_ENABLE_AI_SCANS === 'true' && !!key && dailyLimit > 0 };
}

export function normalizeDetection(provider, result) {
  let score;
  if (provider === 'gptzero') {
    const document = result.documents?.[0];
    // This is the probability of the AI-only class, not a percentage of copied words.
    score = document?.class_probabilities?.ai ?? document?.completely_generated_prob;
  } else if (provider === 'sapling') score = result.score;
  if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 1) {
    throw new Error('Detector response did not include a valid probability.');
  }
  return Math.round(score * 1000) / 10;
}

export async function detectText(text, settings, fetcher = fetch) {
  const isSapling = settings.provider === 'sapling';
  const response = await fetcher(isSapling ? 'https://api.sapling.ai/api/v1/aidetect' : 'https://api.gptzero.me/v2/predict/text', {
    method: 'POST', signal: AbortSignal.timeout(20000),
    headers: { 'Content-Type': 'application/json', ...(isSapling ? {} : { 'x-api-key': settings.key }) },
    body: JSON.stringify(isSapling ? { key: settings.key, text, sent_scores: false } : { document: text }),
  });
  if (!response.ok) throw new Error(`Detector returned HTTP ${response.status}.`);
  const result = await response.json();
  const scorePercent = normalizeDetection(settings.provider, result);
  if (isSapling) return { scorePercent };
  const document = result.documents[0];
  const percent = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1 ? Math.round(value * 1000) / 10 : null;
  return { scorePercent,
    classification: ['ai', 'mixed', 'human'].includes(document.predicted_class) ? document.predicted_class : null,
    confidenceCategory: ['high', 'medium', 'low', 'reject'].includes(document.confidence_category) ? document.confidence_category : null,
    mixedScorePercent: percent(document.class_probabilities?.mixed), humanScorePercent: percent(document.class_probabilities?.human),
    modelVersion: typeof result.version === 'string' ? result.version.slice(0, 100) : null,
  };
}

export async function scanSubmission(store, id, env, fetcher = fetch) {
  const row = await store.get(id);
  if (!row) return null;
  if (row.scan?.status === 'completed') return row;
  const settings = detectorSettings(env);
  const now = () => new Date().toISOString();
  if (!settings.enabled) return store.update(id, { scan: { status: 'pending_configuration', provider: null,
    scorePercent: null, message: 'Received. An organizer will review the brief; automatic AI screening is not configured.' } });
  if (row.extractedText.length < 300 || row.extractedText.length > 150000) {
    return store.update(id, { scan: { status: 'manual_review', provider: settings.label, scorePercent: null,
      message: row.extractedText.length < 300 ? 'Not enough readable text for AI screening. Manual review required.' : 'Document exceeds the detector text limit. Manual review required.' } });
  }
  const claimed = await store.claimScan(id);
  if (!claimed) return store.get(id);
  const allowance = await store.consumeRate(`detector:${new Date().toISOString().slice(0, 10)}`, 86400, settings.dailyLimit);
  if (!allowance) return store.update(id, { scan: { status: 'pending_quota', provider: settings.label, scorePercent: null,
    message: 'The daily screening allowance has been reached. An organizer can retry later.' } });
  try {
    const result = await detectText(claimed.extractedText, settings, fetcher);
    return await store.update(id, { scan: { status: 'completed', provider: settings.label, ...result, scannedAt: now(),
      message: settings.provider === 'gptzero'
        ? 'The score is the probability of the AI-only class. Review the mixed and human probabilities alongside the classification. This is not a plagiarism match rate or a finding of misconduct.'
        : 'AI probability estimate for organizer review. This score is not a plagiarism match rate or a finding of misconduct.' } });
  } catch (error) {
    console.error('IPC detector unavailable:', error.name, String(error.message).replace(/https?:\/\/\S+/g, '[provider]'));
    return store.update(id, { scan: { status: 'failed', provider: settings.label, scorePercent: null, scannedAt: now(),
      message: 'Automatic screening is unavailable. Your submission is saved for organizer review.' } });
  }
}
