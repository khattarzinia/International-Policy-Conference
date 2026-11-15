export const hasAIScore = scan => scan?.status === 'completed' && !scan.outdated
  && typeof scan.scorePercent === 'number' && Number.isFinite(scan.scorePercent)
  && scan.scorePercent >= 0 && scan.scorePercent <= 100;

export const isModelConfidence = scan => scan?.experimental === true || scan?.scoreType === 'model_confidence';

export const aiScoreHeading = scan => scan?.provider === 'GPTZero' ? 'Fully AI-written probability'
  : scan?.provider === 'Sapling' ? 'AI probability' : 'AI likelihood';

// Display the saved detector score; no thresholds or authorship verdicts are inferred.
export function createAIScore(scan, { compact = false, showLabel = true } = {}) {
  const panel = document.createElement('div');
  panel.className = `ai-percentage${compact ? ' ai-percentage-compact' : ''}`;
  const add = (tag, className, text) => {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    panel.append(node);
    return node;
  };
  if (showLabel) add('span', 'ai-percentage-label', aiScoreHeading(scan));
  add('strong', 'ai-percentage-value', hasAIScore(scan) ? `${scan.scorePercent.toFixed(1)}%` : '—');
  if (!hasAIScore(scan)) return panel;
  add('span', 'ai-percentage-kind', isModelConfidence(scan) ? 'Model confidence' : 'Provider estimate');
  if (!compact) {
    const meter = document.createElement('meter');
    meter.className = 'ai-percentage-meter';
    meter.min = 0;
    meter.max = 100;
    meter.value = scan.scorePercent;
    meter.setAttribute('aria-label', aiScoreHeading(scan));
    meter.setAttribute('aria-valuetext', `${scan.scorePercent.toFixed(1)}% ${isModelConfidence(scan) ? 'model confidence' : 'provider estimate'}`);
    panel.append(meter);
    const scale = add('div', 'ai-percentage-scale', '');
    scale.setAttribute('aria-hidden', 'true');
    for (const text of ['0%', '100%']) {
      const endpoint = document.createElement('span');
      endpoint.textContent = text;
      scale.append(endpoint);
    }
  }
  return panel;
}
