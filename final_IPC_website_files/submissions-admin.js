(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const statuses = { received: 'Received', under_review: 'Under review', shortlisted: 'Shortlisted', not_selected: 'Not selected' };
  let submissions = [];
  let selectedId = null;
  let detectorConfigured = false;
  let loading = false;

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
  const hasScore = scan => scan?.status === 'completed' && typeof scan.scorePercent === 'number' && Number.isFinite(scan.scorePercent);
  function scanLabel(scan) {
    if (hasScore(scan)) return `${scan.provider || 'AI scan'} · Complete`;
    if (scan?.status === 'failed' || scan?.status === 'error') return 'Scan needs retry';
    if (scan?.status === 'manual_review') return 'Manual screening needed';
    if (scan?.status === 'pending_configuration' || scan?.status === 'not_configured') return 'Provider not connected';
    return 'Screening pending';
  }

  function showLogin() {
    submissions = [];
    selectedId = null;
    byId('submission-list').replaceChildren();
    renderPlaceholder();
    byId('admin-workspace').hidden = true;
    byId('logout-button').hidden = true;
    byId('admin-login').hidden = false;
    byId('admin-password').value = '';
  }

  function renderPlaceholder() {
    const placeholder = el('div', 'detail-placeholder');
    placeholder.append(el('span', '', '↗'), el('h2', '', 'Room for good judgment.'), el('p', '', 'Select a brief to review its file, screening result, and submission details.'));
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
      button.addEventListener('click', () => { selectedId = entry.id; renderList(); renderDetail(entry); });
      titleCell.append(button);
      const scanCell = el('td');
      scanCell.append(el('span', 'score-value', hasScore(entry.scan) ? `${entry.scan.scorePercent.toFixed(1)}%` : '—'), el('span', 'scan-label', scanLabel(entry.scan)));
      if (entry.scan?.classification) scanCell.append(el('span', 'scan-label', `Classification: ${entry.scan.classification}`));
      const statusCell = el('td');
      statusCell.append(el('span', `status-badge status-${Object.hasOwn(statuses, entry.status) ? entry.status : 'received'}`, statuses[entry.status] || 'Received'), el('span', 'submission-meta', dateLabel(entry.createdAt)));
      row.append(titleCell, scanCell, statusCell);
      list.append(row);
    }
  }

  function replaceEntry(entry) {
    if (!entry?.id) throw new Error('The service did not return the updated submission. Refresh to check its status.');
    submissions = submissions.map(existing => existing.id === entry.id ? entry : existing);
    renderList();
    renderDetail(entry);
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
    const screening = el('section', 'screening-panel');
    screening.append(el('h3', '', entry.scan?.provider === 'GPTZero' ? 'Fully AI-written probability' : 'AI probability'), el('div', 'screening-score', hasScore(entry.scan) ? `${entry.scan.scorePercent.toFixed(1)}%` : '—'), el('p', '', scanLabel(entry.scan)));
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
      detectorConfigured = result.detectorConfigured === true;
      byId('admin-login').hidden = true;
      byId('admin-workspace').hidden = false;
      byId('logout-button').hidden = false;
      byId('admin-password').value = '';
      renderList();
      const selected = submissions.find(entry => entry.id === selectedId);
      if (selected) renderDetail(selected);
      else { selectedId = null; renderPlaceholder(); }
      notice('admin-status', detectorConfigured ? '' : 'AI screening is pending: connect a provider to run scans. Entries remain available for manual review.');
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
