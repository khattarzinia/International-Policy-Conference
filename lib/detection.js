export function detectorSettings(env) {
  const provider = env.IPC_AI_PROVIDER || 'local';
  const key = provider === 'gptzero' ? env.GPTZERO_API_KEY : provider === 'sapling' ? env.SAPLING_API_KEY : provider === 'local' ? env.IPC_MODEL_TOKEN : null;
  let endpoint;
  if (provider === 'local') {
    try {
      const parsed = new URL(env.IPC_AI_ENDPOINT || '');
      const isDevelopment = env.IPC_LOCAL_STORAGE === 'true' && !env.VERCEL && env.NODE_ENV !== 'production';
      const secure = parsed.protocol === 'https:' || (isDevelopment && parsed.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname));
      if (secure && !parsed.username && !parsed.password && !parsed.search && !parsed.hash && ['/', '/predict'].includes(parsed.pathname)) {
        parsed.pathname = '/predict';
        endpoint = parsed.href;
      }
    } catch { /* An unconfigured model service remains unavailable. */ }
  }
  const dailyLimit = Math.max(0, Math.min(10000, Number.parseInt(env.IPC_MAX_SCANS_PER_DAY || '0', 10) || 0));
  return { provider, label: provider === 'local' ? 'IPC detector' : provider === 'sapling' ? 'Sapling' : 'GPTZero', key, dailyLimit, endpoint,
    modelVersion: provider === 'local' && typeof env.IPC_MODEL_VERSION === 'string' && env.IPC_MODEL_VERSION.length <= 160 ? env.IPC_MODEL_VERSION : null,
    experimental: provider === 'local',
    enabled: env.IPC_ENABLE_AI_SCANS === 'true' && !!key && dailyLimit > 0 && (provider !== 'local' || (!!endpoint && key.length >= 24)) };
}

export function normalizeDetection(provider, result) {
  let score;
  if (provider === 'gptzero') {
    const document = result.documents?.[0];
    // This is the probability of the AI-only class, not a percentage of copied words.
    score = document?.class_probabilities?.ai ?? document?.completely_generated_prob;
  } else if (provider === 'sapling' || provider === 'local') score = result.score;
  if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 1) {
    throw new Error('Detector response did not include a valid probability.');
  }
  return Math.round(score * 1000) / 10;
}

export async function detectText(text, settings, fetcher = fetch) {
  if (settings.provider === 'local') {
    const response = await fetcher(settings.endpoint, {
      method: 'POST', signal: AbortSignal.timeout(60000), redirect: 'error',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.key}` },
      body: JSON.stringify({ document: text }),
    });
    if (!response.ok) throw new Error(`Model service returned HTTP ${response.status}.`);
    const result = await response.json();
    if (settings.modelVersion && result.modelVersion !== settings.modelVersion) throw new Error('Model service version differs from the configured checkpoint.');
    const scorePercent = normalizeDetection('local', result);
    if (result.experimental !== true || result.scoreType !== 'model_confidence' || typeof result.modelVersion !== 'string' || !result.modelVersion || result.modelVersion.length > 160 ||
      !Number.isSafeInteger(result.analyzedCharacters) || !Number.isSafeInteger(result.totalCharacters) || result.totalCharacters !== text.length ||
      result.analyzedCharacters < 1 || result.analyzedCharacters > result.totalCharacters) {
      throw new Error('Model service did not return valid model provenance and coverage.');
    }
    const segments = [];
    for (const segment of (Array.isArray(result.segments) ? result.segments.slice(0, 64) : [])) {
      if (!Number.isSafeInteger(segment.start) || !Number.isSafeInteger(segment.end) || segment.start < 0 || segment.end > text.length || segment.start >= segment.end ||
        typeof segment.score !== 'number' || !Number.isFinite(segment.score) || segment.score < 0 || segment.score > 1) throw new Error('Model service returned invalid passage scores.');
      segments.push({ start: segment.start, end: segment.end, scorePercent: Math.round(segment.score * 1000) / 10 });
    }
    return { scorePercent, modelVersion: result.modelVersion, experimental: true, scoreType: 'model_confidence',
      coveragePercent: Math.round(result.analyzedCharacters / result.totalCharacters * 1000) / 10,
      analyzedCharacters: result.analyzedCharacters, totalCharacters: result.totalCharacters,
      classification: ['ai', 'human'].includes(result.label) ? result.label : null,
      validationSummary: typeof result.validationSummary === 'string' ? result.validationSummary.slice(0, 600) : 'Experimental model trained on public data; policy-brief validation is pending.',
      segments,
    };
  }
  const isSapling = settings.provider === 'sapling';
  const response = await fetcher(isSapling ? 'https://api.sapling.ai/api/v1/aidetect' : 'https://api.gptzero.me/v2/predict/text', {
    method: 'POST', signal: AbortSignal.timeout(20000),
    headers: { 'Content-Type': 'application/json', ...(isSapling ? {} : { 'x-api-key': settings.key }) },
    body: JSON.stringify(isSapling ? { key: settings.key, text, sent_scores: false, zero_retention: true } : { document: text }),
  });
  if (!response.ok) throw new Error(`Detector returned HTTP ${response.status}.`);
  const result = await response.json();
  const scorePercent = normalizeDetection(settings.provider, result);
  if (isSapling) return { scorePercent,
    classification: ['ai', 'mixed', 'human'].includes(result.verdict) ? result.verdict : null,
    flaggedSentenceSharePercent: typeof result.ai_fraction === 'number' && result.ai_fraction >= 0 && result.ai_fraction <= 1 ? Math.round(result.ai_fraction * 1000) / 10 : null,
  };
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
  const settings = detectorSettings(env);
  if (row.scan?.status === 'completed' && (!settings.enabled ||
    (row.scan.provider === settings.label && (settings.provider !== 'local' || !settings.modelVersion || row.scan.modelVersion === settings.modelVersion)))) return row;
  const now = () => new Date().toISOString();
  if (!settings.enabled) return store.update(id, { scan: { status: 'pending_configuration', provider: null,
    scorePercent: null, message: 'Received. An organizer will review the brief; automatic AI screening is not configured.' } });
  if (row.extractedText.length < 300 || row.extractedText.length > 150000) {
    return store.update(id, { scan: { status: 'manual_review', provider: settings.label, scorePercent: null,
      message: row.extractedText.length < 300 ? 'Not enough readable text for AI screening. Manual review required.' : 'Document exceeds the detector text limit. Manual review required.' } });
  }
  const claimed = await store.claimScan(id, settings.provider === 'local' ? settings.modelVersion : null);
  if (!claimed) return store.get(id);
  const allowance = await store.consumeRate(`detector:${new Date().toISOString().slice(0, 10)}`, 86400, settings.dailyLimit);
  if (!allowance) return store.update(id, { scan: { status: 'pending_quota', provider: settings.label, scorePercent: null,
    message: 'The daily screening allowance has been reached. An organizer can retry later.' } });
  try {
    const result = await detectText(claimed.extractedText, settings, fetcher);
    return await store.update(id, { scan: { status: 'completed', provider: settings.label, ...result, scannedAt: now(),
      message: settings.provider === 'local'
        ? 'Experimental model confidence from a locally hosted detector trained on public labeled text. Policy-brief validation is pending. This is not a calibrated probability, percentage of AI-written words, or finding of misconduct.'
        : settings.provider === 'gptzero'
        ? 'The score is the probability of the AI-only class. Review the mixed and human probabilities alongside the classification. This is not a plagiarism match rate or a finding of misconduct.'
        : 'AI probability estimate for organizer review. This score is not a plagiarism match rate or a finding of misconduct.' } });
  } catch (error) {
    console.error('IPC detector unavailable:', error.name, String(error.message).replace(/https?:\/\/\S+/g, '[provider]'));
    return store.update(id, { scan: { status: 'failed', provider: settings.label, scorePercent: null, scannedAt: now(),
      message: 'Automatic screening is unavailable. Your submission is saved for organizer review.' } });
  }
}
