(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const statuses = { received: 'Received', under_review: 'Under review', shortlisted: 'Shortlisted', not_selected: 'Not selected' };
  let submissions = [];
  let selectedId = null;
  let detectorConfigured = false;
  let loading = false;
  let sessionGeneration = 0;
  const comparisons = new Map();
  const comparisonsInProgress = new Set();

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function notice(id, text, error = false) {
    const node = byId(id);
    node.textContent = text;
    node.hidden = !text;
    node.classList.toggle('notice-error', error);
  }

  async function request(url, options = {}) {
    let response;
    try { response = await fetch(url, { credentials: 'same-origin', ...options }); }
    catch { throw new Error('Connection lost. Check your connection and try again.'); }
    let data;
    try { data = await response.json(); }
    catch { throw new Error('The review service is unavailable. Please try again later.'); }
    if (!response.ok) {
      const message = typeof data.error === 'string' ? data.error : data.error?.message || data.message;
      const error = new Error(typeof message === 'string' ? message : 'The request could not be completed.');
      error.status = response.status;
      throw error;
    }
    return data;
  }

  const post = (url, body) => request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const dateLabel = value => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };
  const hasScore = scan => scan?.status === 'completed' && typeof scan.scorePercent === 'number' && Number.isFinite(scan.scorePercent) && scan.scorePercent >= 0 && scan.scorePercent <= 100;
  const experimentalScore = scan => scan?.experimental === true || scan?.scoreType === 'model_confidence';
  const hasOverlap = comparison => comparison?.status === 'completed' && !comparison.stale && comparison.comparedCount > 0 && typeof comparison.matchedWordPercent === 'number' && Number.isFinite(comparison.matchedWordPercent) && comparison.matchedWordPercent >= 0 && comparison.matchedWordPercent <= 100;
  const coverage = scan => typeof scan?.coveragePercent === 'number' && Number.isFinite(scan.coveragePercent) ? Math.max(0, Math.min(100, scan.coveragePercent)) : null;
  const aiHeading = scan => experimentalScore(scan) ? 'AI likelihood (experimental)' : scan?.provider === 'GPTZero' ? 'Fully AI-written probability' : scan?.provider === 'Sapling' ? 'AI probability' : 'AI likelihood';
  function scanLabel(scan) {
    if (hasScore(scan)) return `${scan.provider || 'AI scan'} · ${experimentalScore(scan) ? 'Experimental' : 'Complete'}`;
    if (scan?.status === 'failed' || scan?.status === 'error') return 'Scan needs retry';
    if (scan?.status === 'manual_review') return 'Manual screening needed';
    if (scan?.status === 'pending_configuration' || scan?.status === 'not_configured') return 'Provider not connected';
    return 'Screening pending';
  }

  function showLogin() {
    sessionGeneration++;
    submissions = [];
    selectedId = null;
    comparisons.clear();
    comparisonsInProgress.clear();
    byId('submission-list').replaceChildren();
    renderPlaceholder();
    byId('admin-workspace').hidden = true;
    byId('logout-button').hidden = true;
    byId('admin-login').hidden = false;
    byId('admin-password').value = '';
  }

  function renderPlaceholder() {
    const placeholder = el('div', 'detail-placeholder');
    placeholder.append(el('span', '', '↗'), el('h2', '', 'Room for good judgment.'), el('p', '', 'Select a brief to compare it with other entries, inspect AI likelihood, and record your review.'));
    placeholder.firstChild.setAttribute('aria-hidden', 'true');
    byId('review-detail').replaceChildren(placeholder);
  }

  function filteredEntries() {
    const query = byId('review-search').value.trim().toLowerCase();
    const filter = byId('review-filter').value;
    return submissions.filter(entry => (filter === 'all' || entry.status === filter) && (!query || [entry.title, entry.contactName, entry.email, entry.institution, entry.teamName, entry.category].some(value => String(value || '').toLowerCase().includes(query))));
  }

  function renderList() {
    const list = byId('submission-list');
    list.replaceChildren();
    const visible = filteredEntries();
    byId('total-count').textContent = submissions.length;
    byId('pending-count').textContent = submissions.filter(entry => entry.status === 'received' || entry.status === 'under_review').length;
    byId('screened-count').textContent = submissions.filter(entry => hasScore(entry.scan)).length;
    byId('result-count').textContent = `${visible.length} ${visible.length === 1 ? 'entry' : 'entries'} shown`;
    byId('empty-state').hidden = visible.length > 0;
    byId('empty-state').textContent = submissions.length ? 'No entries match these filters.' : 'No submissions to show yet.';
    for (const entry of visible) {
      const row = el('tr', entry.id === selectedId ? 'selected' : '');
      const titleCell = el('td');
      const button = el('button', 'submission-select');
      button.type = 'button';
      button.setAttribute('aria-label', `Review ${entry.title}`);
      button.setAttribute('aria-pressed', String(entry.id === selectedId));
      button.append(el('strong', '', entry.title), el('span', 'submission-meta', `${entry.contactName} · ${entry.institution}`), el('span', 'submission-meta', entry.category));
      button.addEventListener('click', () => selectEntry(entry));
      titleCell.append(button);
      const scanCell = el('td');
      scanCell.append(el('span', 'score-value', hasScore(entry.scan) ? `${entry.scan.scorePercent.toFixed(1)}%` : '—'), el('span', 'scan-label', scanLabel(entry.scan)));
      if (experimentalScore(entry.scan) && hasScore(entry.scan)) scanCell.append(el('span', 'scan-label', 'Model confidence'));
      if (coverage(entry.scan) !== null && coverage(entry.scan) < 100) scanCell.append(el('span', 'scan-label partial-coverage-label', `${coverage(entry.scan).toFixed(1)}% of text analyzed`));
      if (entry.scan?.classification) scanCell.append(el('span', 'scan-label', `Classification: ${entry.scan.classification}`));
      const comparison = comparisons.get(entry.id) || entry.comparisonSummary;
      const similarityCell = el('td');
      const comparisonLabel = comparison?.stale ? 'Needs refresh' : comparison?.status === 'completed' ? comparison.comparedCount === 0 ? 'No other entries' : `${comparison.comparedCount} entries compared` : comparison?.status === 'insufficient_text' ? 'Not enough text' : 'Not compared';
      similarityCell.append(el('span', 'score-value', hasOverlap(comparison) ? `${comparison.matchedWordPercent.toFixed(1)}%` : '—'), el('span', 'scan-label', comparisonLabel));
      const statusCell = el('td');
      statusCell.append(el('span', `status-badge status-${Object.hasOwn(statuses, entry.status) ? entry.status : 'received'}`, statuses[entry.status] || 'Received'), el('span', 'submission-meta', dateLabel(entry.createdAt)));
      row.append(titleCell, similarityCell, scanCell, statusCell);
      list.append(row);
    }
  }

  function replaceEntry(entry) {
    if (!entry?.id) throw new Error('The service did not return the updated submission. Refresh to check its status.');
    submissions = submissions.map(existing => existing.id === entry.id ? entry : existing);
    renderList();
    renderDetail(entry);
  }

  function selectEntry(entry) {
    selectedId = entry.id;
    renderList();
    renderDetail(entry);
  }

  function comparisonPanel(entry) {
    const panel = el('section', 'screening-panel comparison-panel');
    panel.setAttribute('aria-label', 'Cross-submission comparison');
    panel.dataset.submissionId = entry.id;
    const render = () => {
      panel.replaceChildren();
      const comparison = comparisons.get(entry.id);
      const summary = comparison || entry.comparisonSummary;
      const header = el('div', 'analysis-heading');
      header.append(el('span', 'analysis-number', '01'), el('h3', '', 'Across submissions'));
      panel.append(header);
      const running = comparisonsInProgress.has(entry.id);
      const button = el('button', 'portal-button button-secondary compare-submissions-button', running ? 'Comparing…' : 'Compare submissions ↗');
      button.type = 'button';
      button.disabled = running;
      panel.append(el('div', 'screening-score', hasOverlap(summary) ? `${summary.matchedWordPercent.toFixed(1)}%` : '—'));
      panel.append(el('p', 'comparison-definition', 'Share of this brief’s eligible body words in substantive phrases also found in other IPC submissions.'));
      if (summary?.analyzedAt) panel.append(el('p', 'analysis-meta', `Compared ${dateLabel(summary.analyzedAt)} · ${summary.comparedCount || 0} other ${summary.comparedCount === 1 ? 'entry' : 'entries'}`));
      if (summary?.stale) panel.append(el('p', '', 'The submission collection has changed. Compare again to refresh this result.'));
      else if (summary?.status === 'insufficient_text') panel.append(el('p', '', 'There is not enough readable body text for a meaningful comparison. Review the original file.'));
      else if (summary?.status === 'completed' && summary.comparedCount === 0) panel.append(el('p', '', 'There are no other eligible entries to compare yet. Run this again after more submissions arrive.'));
      else if (!summary) panel.append(el('p', '', 'No comparison has run for this brief yet.'));
      else if (!comparison) panel.append(el('p', '', 'A saved comparison summary is shown. Compare again to load its matching passages against the current submissions.'));
      panel.append(button);
      const message = el('p', 'comparison-message');
      message.setAttribute('role', 'status');
      message.setAttribute('aria-live', 'polite');
      if (running) message.textContent = 'Comparing the saved brief with the current submission collection…';
      panel.append(message);
      if (comparison) {
        if (comparison.message) panel.append(el('p', '', comparison.message));
        if (comparison.analyzedWords !== undefined) panel.append(el('p', 'analysis-meta', `${comparison.analyzedWords} body words analyzed${comparison.excludedReferences ? ' · References excluded' : ''}`));
        if (comparison.status === 'completed' && comparison.comparedCount > 0 && !comparison.matches?.length) panel.append(el('p', 'comparison-empty', 'No substantive shared phrases found in the entries compared.'));
        const matches = Array.isArray(comparison.matches) ? comparison.matches : [];
        for (const match of matches) {
          const article = el('article', 'comparison-match');
          const matchHeader = el('div', 'match-heading');
          matchHeader.append(el('h4', '', match.title || 'Untitled submission'));
          if (typeof match.overlapPercent === 'number' && Number.isFinite(match.overlapPercent)) matchHeader.append(el('span', 'match-score', `${match.overlapPercent.toFixed(1)}%`));
          article.append(matchHeader, el('p', 'analysis-meta', [match.category, typeof match.sharedWordCount === 'number' ? `${match.sharedWordCount} shared words` : null].filter(Boolean).join(' · ')));
          const actions = el('div', 'match-actions');
          const related = submissions.find(candidate => candidate.id === match.submissionId);
          if (related) {
            const select = el('button', 'text-button', 'Review this entry ↗');
            select.type = 'button';
            select.addEventListener('click', () => { selectEntry(related); byId('review-detail').scrollIntoView({ block: 'start', behavior: 'smooth' }); });
            actions.append(select);
          }
          const download = el('a', 'text-button', 'Download source brief ↓');
          download.href = `/api/admin/download?id=${encodeURIComponent(String(match.submissionId || ''))}`;
          actions.append(download);
          article.append(actions);
          const passages = Array.isArray(match.passages) ? match.passages : [];
          if (passages.length) {
            const passagesDetail = el('details', 'matching-passages');
            const summary = el('summary', '', `${passages.length} matching ${passages.length === 1 ? 'passage' : 'passages'} shown`);
            passagesDetail.append(summary);
            for (const passage of passages) {
              const pair = el('div', 'passage-pair');
              const target = el('div', 'passage-side');
              target.append(el('h5', '', 'This brief'), el('blockquote', '', passage.targetText || ''));
              const source = el('div', 'passage-side');
              source.append(el('h5', '', 'Other submission'), el('blockquote', '', passage.sourceText || ''));
              pair.append(target, source);
              passagesDetail.append(pair);
            }
            article.append(passagesDetail);
          }
          panel.append(article);
        }
      }
      panel.append(el('p', 'analysis-caveat', 'Compare again when new entries arrive. Shared text needs context: quotations, common sources, and collaboration can explain overlap. This checks IPC submissions, not the wider internet, and does not establish plagiarism.'));
      button.addEventListener('click', async () => {
        if (comparisonsInProgress.has(entry.id)) return;
        comparisonsInProgress.add(entry.id);
        const requestGeneration = sessionGeneration;
        render();
        try {
          const result = await post('/api/admin/compare', { id: entry.id });
          if (requestGeneration !== sessionGeneration) return;
          const value = result.comparison;
          if (!value || !['completed', 'insufficient_text'].includes(value.status) || !Array.isArray(value.matches)) throw new Error('No usable comparison result was returned. Please try again.');
          comparisons.set(entry.id, value);
          const loaded = submissions.find(candidate => candidate.id === entry.id);
          if (loaded) loaded.comparisonSummary = { status: value.status, matchedWordPercent: value.matchedWordPercent, comparedCount: value.comparedCount, analyzedAt: value.analyzedAt, corpusTotal: value.corpusTotal, stale: false };
          comparisonsInProgress.delete(entry.id);
          renderList();
          const activePanel = byId('review-detail').querySelector('.comparison-panel');
          if (selectedId === entry.id && activePanel?.dataset.submissionId === entry.id) activePanel.replaceWith(comparisonPanel(loaded || entry));
        } catch (error) {
          if (requestGeneration !== sessionGeneration) return;
          comparisonsInProgress.delete(entry.id);
          if (error.status === 401) { showLogin(); notice('login-error', 'Your session ended. Please sign in again.', true); return; }
          const activePanel = byId('review-detail').querySelector('.comparison-panel');
          if (selectedId === entry.id && activePanel?.dataset.submissionId === entry.id) {
            const freshPanel = comparisonPanel(submissions.find(candidate => candidate.id === entry.id) || entry);
            activePanel.replaceWith(freshPanel);
            const notice = freshPanel.querySelector('.comparison-message');
            notice.textContent = error.message;
            notice.classList.add('error');
          }
        }
      });
    };
    render();
    return panel;
  }

  function renderDetail(entry) {
    const detail = byId('review-detail');
    detail.replaceChildren();
    detail.append(el('p', 'detail-eyebrow', 'Submission / Review'), el('h2', 'detail-title', entry.title), el('p', 'detail-date', `Received ${dateLabel(entry.createdAt)}`));
    const data = el('dl', 'detail-data');
    for (const [label, value] of [['Contact', entry.contactName], ['Email', entry.email], ['Institution', entry.institution], ['Country', entry.country], ['Category', entry.category], ['Team', entry.teamName || 'Individual entry'], ['Members', entry.teamMembers || '—'], ['Disclosures', entry.conflicts || 'None disclosed']]) data.append(el('dt', '', label), el('dd', '', value));
    detail.append(data);
    const actions = el('div', 'detail-actions');
    const download = el('a', 'portal-button button-secondary', 'Download brief ↓');
    download.href = `/api/admin/download?id=${encodeURIComponent(entry.id)}`;
    download.setAttribute('aria-label', `Download ${entry.filename || entry.title}`);
    const scanButton = el('button', 'portal-button button-secondary', hasScore(entry.scan) ? 'Screening complete ✓' : 'Run AI screening ↗');
    scanButton.type = 'button';
    scanButton.disabled = !detectorConfigured || hasScore(entry.scan);
    if (!detectorConfigured) scanButton.title = 'Connect an AI screening provider before scanning.';
    actions.append(download, scanButton);
    detail.append(actions);
    detail.append(comparisonPanel(entry));
    const screening = el('section', 'screening-panel');
    const screeningHeading = el('div', 'analysis-heading');
    screeningHeading.append(el('span', 'analysis-number', '02'), el('h3', '', aiHeading(entry.scan)));
    screening.append(screeningHeading, el('div', 'screening-score', hasScore(entry.scan) ? `${entry.scan.scorePercent.toFixed(1)}%` : '—'), el('p', '', scanLabel(entry.scan)));
    if (experimentalScore(entry.scan)) {
      screening.append(el('p', 'experimental-note', 'Experimental model confidence. This has not been validated on IPC policy briefs and is not a calibrated probability.'));
      const validation = entry.scan?.validationSummary;
      if (typeof validation === 'string') screening.append(el('p', '', validation));
      else if (validation && typeof validation.message === 'string') screening.append(el('p', '', validation.message));
    }
    const analyzedCoverage = coverage(entry.scan);
    if (analyzedCoverage !== null) screening.append(el('p', analyzedCoverage < 100 ? 'partial-coverage-note' : 'analysis-meta', `${analyzedCoverage < 100 ? 'Partial analysis: ' : ''}${analyzedCoverage.toFixed(1)}% of this brief’s text was analyzed.${analyzedCoverage < 100 ? ' The score covers only the analyzed text.' : ''}`));
    const classifications = { ai: 'AI writing', mixed: 'Mixed human and AI writing', human: 'Human writing' };
    if (classifications[entry.scan?.classification]) screening.append(el('p', '', `Provider classification: ${classifications[entry.scan.classification]}`));
    if (typeof entry.scan?.mixedScorePercent === 'number') screening.append(el('p', '', `Mixed-writing probability: ${entry.scan.mixedScorePercent.toFixed(1)}%`));
    if (typeof entry.scan?.humanScorePercent === 'number') screening.append(el('p', '', `Human-writing probability: ${entry.scan.humanScorePercent.toFixed(1)}%`));
    if (entry.scan?.confidenceCategory) screening.append(el('p', '', `Confidence: ${entry.scan.confidenceCategory === 'reject' ? 'Too low to classify reliably' : entry.scan.confidenceCategory}`));
    if (entry.scan?.modelVersion) screening.append(el('p', '', `Detector model: ${entry.scan.modelVersion}`));
    if (entry.scan?.message) screening.append(el('p', '', entry.scan.message));
    if (entry.scan?.scannedAt) screening.append(el('p', '', `Scanned ${dateLabel(entry.scan.scannedAt)}`));
    screening.append(el('p', '', 'This estimate is not the percentage of words written by AI. It is separate from plagiarism screening and requires human interpretation.'));
    detail.append(screening);
    const reviewForm = el('form', 'detail-review-form');
    const statusField = el('div', 'field');
    const statusLabel = el('label', '', 'Review status');
    statusLabel.htmlFor = 'detail-status';
    const select = el('select');
    select.id = 'detail-status';
    for (const [value, label] of Object.entries(statuses)) {
      const option = el('option', '', label);
      option.value = value;
      select.append(option);
    }
    select.value = Object.hasOwn(statuses, entry.status) ? entry.status : 'received';
    statusField.append(statusLabel, select);
    const notesField = el('div', 'field');
    const notesLabel = el('label', '', 'Organizer notes');
    notesLabel.htmlFor = 'review-notes';
    const notes = el('textarea');
    notes.id = 'review-notes';
    notes.rows = 4;
    notes.maxLength = 5000;
    notes.value = entry.reviewNotes || '';
    notes.placeholder = 'Record the context behind your review.';
    notesField.append(notesLabel, notes);
    const save = el('button', 'portal-button', 'Save review →');
    save.type = 'submit';
    const message = el('p', 'detail-message');
    message.setAttribute('role', 'status');
    message.setAttribute('aria-live', 'polite');
    reviewForm.append(statusField, notesField, save, message);
    detail.append(reviewForm);

    reviewForm.addEventListener('submit', async event => {
      event.preventDefault();
      save.disabled = true;
      message.classList.remove('error');
      message.textContent = 'Saving review…';
      try {
        const result = await post('/api/admin/review', { id: entry.id, status: select.value, notes: notes.value });
        replaceEntry(result.submission);
        const updated = byId('review-detail').querySelector('.detail-message');
        updated.textContent = 'Review saved.';
      } catch (error) {
        if (error.status === 401) { showLogin(); notice('login-error', 'Your session ended. Please sign in again.', true); return; }
        message.classList.add('error');
        message.textContent = error.message;
      } finally { save.disabled = false; }
    });

    scanButton.addEventListener('click', async () => {
      if (!detectorConfigured || hasScore(entry.scan)) return;
      scanButton.disabled = true;
      message.classList.remove('error');
      message.textContent = 'Screening the saved brief…';
      try {
        const result = await post('/api/admin/scan', { id: entry.id });
        replaceEntry(result.submission);
        byId('review-detail').querySelector('.detail-message').textContent = 'Screening result updated.';
      } catch (error) {
        if (error.status === 401) { showLogin(); notice('login-error', 'Your session ended. Please sign in again.', true); return; }
        message.classList.add('error');
        message.textContent = error.message;
      } finally { scanButton.disabled = !detectorConfigured; }
    });
  }

  async function loadSubmissions(initial = false) {
    if (loading) return;
    loading = true;
    byId('refresh-button').disabled = true;
    try {
      const result = await request('/api/admin/submissions');
      if (!Array.isArray(result.submissions)) throw new Error('The service returned an invalid submission list.');
      submissions = result.submissions;
      for (const entry of submissions) if (entry.comparisonSummary?.stale) comparisons.delete(entry.id);
      detectorConfigured = result.detectorConfigured === true;
      byId('admin-login').hidden = true;
      byId('admin-workspace').hidden = false;
      byId('logout-button').hidden = false;
      byId('admin-password').value = '';
      renderList();
      const selected = submissions.find(entry => entry.id === selectedId);
      if (selected) renderDetail(selected);
      else { selectedId = null; renderPlaceholder(); }
      notice('admin-status', detectorConfigured ? '' : 'AI likelihood is pending: connect the screening model to run it. You can still compare submissions and review the original briefs.');
    } catch (error) {
      if (error.status === 401) { showLogin(); if (!initial) notice('login-error', 'Your session ended. Please sign in again.', true); }
      else if (byId('admin-workspace').hidden) notice('login-error', error.message, true);
      else notice('admin-status', error.message, true);
    } finally { loading = false; byId('refresh-button').disabled = false; }
  }

  byId('login-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const button = byId('login-button');
    button.disabled = true;
    notice('login-error', '');
    try {
      await post('/api/admin/login', { password: byId('admin-password').value });
      await loadSubmissions();
    } catch (error) { notice('login-error', error.message, true); }
    finally { button.disabled = false; byId('admin-password').value = ''; }
  });
  byId('logout-button').addEventListener('click', async () => {
    try { await post('/api/admin/logout', {}); showLogin(); }
    catch (error) { notice('admin-status', `Sign out failed: ${error.message}`, true); }
  });
  byId('refresh-button').addEventListener('click', () => loadSubmissions());
  byId('review-search').addEventListener('input', renderList);
  byId('review-filter').addEventListener('change', renderList);
  loadSubmissions(true);
})();
