(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const form = byId('submission-form');
  const fields = byId('submission-fields');
  const fileInput = byId('brief');
  let config = null;
  let savedReceipt = null;
  let submitting = false;
  const labels = { received: 'Received', under_review: 'Under review', shortlisted: 'Shortlisted', not_selected: 'Not selected' };

  async function request(url, options = {}) {
    let response;
    try { response = await fetch(url, { credentials: 'same-origin', ...options }); }
    catch { throw new Error('We could not connect. Check your connection and try again.'); }
    let data;
    try { data = await response.json(); }
    catch { throw new Error('The submission service is unavailable. Please try again later.'); }
    if (!response.ok) {
      const message = typeof data.error === 'string' ? data.error : data.error?.message || data.message;
      throw new Error(typeof message === 'string' ? message : 'The request could not be completed. Please try again.');
    }
    return data;
  }

  function setNotice(element, message, error = false) {
    element.textContent = message;
    element.classList.toggle('notice-error', error);
    element.hidden = !message;
  }

  function scanDescription(scan) {
    if (!scan) return 'Your brief is saved and awaiting organizer review.';
    if (scan.status === 'completed') {
      const label = scan.provider === 'GPTZero' ? 'Fully AI-written probability' : 'AI probability';
      const score = typeof scan.scorePercent === 'number' ? ` ${label}: ${scan.scorePercent.toFixed(1)}%.` : '';
      const classifications = { ai: 'AI writing', mixed: 'mixed human and AI writing', human: 'human writing' };
      const classification = classifications[scan.classification] ? ` Provider classification: ${classifications[scan.classification]}.` : '';
      const mixed = typeof scan.mixedScorePercent === 'number' ? ` Mixed-writing probability: ${scan.mixedScorePercent.toFixed(1)}%.` : '';
      const confidence = scan.confidenceCategory ? ` Confidence: ${scan.confidenceCategory === 'reject' ? 'too low to classify reliably' : scan.confidenceCategory}.` : '';
      return `AI screening complete${scan.provider ? ` with ${scan.provider}` : ''}.${score}${classification}${mixed}${confidence} The IPC team will review the result alongside your brief.`;
    }
    if (scan.status === 'pending_configuration' || scan.status === 'not_configured') return 'Your brief is saved. AI screening is pending while the IPC team sets up its screening provider.';
    if (scan.status === 'failed' || scan.status === 'error') return 'Your brief is saved. Automated screening could not finish; the IPC team can retry it and review your entry.';
    if (scan.status === 'manual_review') return 'Your brief is saved and needs a manual screening review by the IPC team.';
    return scan.message || 'Your brief is saved. Screening and organizer review are pending.';
  }

  function dateLabel(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }

  function validateFile() {
    const file = fileInput.files[0];
    fileInput.setCustomValidity('');
    byId('file-label').textContent = file?.name || 'Choose your policy brief';
    if (!file) {
      byId('file-feedback').textContent = 'Choose a file with selectable text so it can be screened.';
      return;
    }
    if (!/\.(pdf|docx|txt)$/i.test(file.name)) fileInput.setCustomValidity('Choose a PDF, DOCX, or TXT file.');
    else if (file.size === 0) fileInput.setCustomValidity('This file is empty. Choose your completed policy brief.');
    else if (file.size > (config?.maxFileBytes || 4 * 1024 * 1024)) fileInput.setCustomValidity('This file is too large. Choose a brief within the upload limit.');
    const feedback = byId('file-feedback');
    feedback.textContent = fileInput.validationMessage || `${(file.size / 1024 / 1024).toFixed(2)} MB · Ready to submit`;
    feedback.style.color = fileInput.validationMessage ? '#9e3727' : '';
    fileInput.setAttribute('aria-invalid', String(!fileInput.validity.valid));
  }

  async function loadConfig() {
    try {
      config = await request('/api/config');
      if (!Array.isArray(config.categories)) throw new Error('The submission service is not ready. Please try again later.');
      const select = byId('category');
      for (const category of config.categories) {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        select.append(option);
      }
      const megabytes = (config.maxFileBytes || 4 * 1024 * 1024) / 1024 / 1024;
      byId('file-hint').textContent = `PDF, DOCX, or TXT · Maximum ${megabytes.toFixed(megabytes % 1 ? 1 : 0)} MB · PDFs up to 80 pages`;
      byId('detector-disclosure').textContent = config.detectorConfigured
        ? `Screening provider: ${config.detectorProvider || 'the IPC screening service'}. The brief’s text is sent to this provider for analysis.`
        : 'An AI screening provider has not been connected yet. Your brief will be saved with screening pending and may be screened once the IPC team connects its provider.';
      if (!config.storageReady) {
        setNotice(byId('portal-status'), 'The submission portal is being prepared. Please check back or contact the IPC team.', true);
      } else if (!config.acceptingSubmissions) {
        setNotice(byId('portal-status'), 'The portal is not accepting submissions right now. Please contact the IPC team for updates.');
      } else {
        fields.disabled = false;
        setNotice(byId('portal-status'), config.localDevelopment ? 'Development portal · Entries here are saved for testing on this computer.' : 'Ready for your policy brief. You’ll receive a receipt after it is saved.');
      }
    } catch (error) {
      setNotice(byId('portal-status'), error.message, true);
      byId('detector-disclosure').textContent = 'The screening service is currently unavailable.';
    }
  }

  fileInput.addEventListener('change', validateFile);
  const uploadArea = fileInput.closest('.upload-area');
  ['dragenter', 'dragover'].forEach(name => uploadArea.addEventListener(name, () => uploadArea.classList.add('drag-over')));
  ['dragleave', 'drop'].forEach(name => uploadArea.addEventListener(name, () => uploadArea.classList.remove('drag-over')));
  form.addEventListener('input', event => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) event.target.removeAttribute('aria-invalid');
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting || fields.disabled) return;
    validateFile();
    setNotice(byId('submission-error'), '');
    if (!form.checkValidity()) {
      const invalid = form.querySelector('input:invalid, select:invalid, textarea:invalid');
      invalid?.setAttribute('aria-invalid', 'true');
      form.reportValidity();
      invalid?.focus();
      return;
    }
    submitting = true;
    const button = byId('submit-button');
    button.disabled = true;
    button.textContent = 'Saving your brief…';
    form.setAttribute('aria-busy', 'true');
    try {
      const data = await request('/api/submissions', { method: 'POST', body: new FormData(form) });
      const receipt = data.submission;
      if (!receipt?.receiptCode) throw new Error('The service did not return a receipt. Please contact the IPC team before resubmitting.');
      savedReceipt = { ...receipt, email: byId('email').value.trim() };
      byId('receipt-title').textContent = receipt.title;
      byId('receipt-code').textContent = receipt.receiptCode;
      byId('receipt-time').textContent = `Saved ${dateLabel(receipt.createdAt)}`;
      setNotice(byId('receipt-scan'), scanDescription(receipt.scan));
      byId('lookup-email').value = savedReceipt.email;
      byId('lookup-code').value = receipt.receiptCode;
      form.hidden = true;
      byId('portal-status').hidden = true;
      const success = byId('submission-success');
      success.hidden = false;
      success.focus();
    } catch (error) {
      setNotice(byId('submission-error'), `${error.message} If the connection dropped after submitting, check your receipt or contact IPC before sending another entry.`, true);
      byId('submission-error').scrollIntoView({ block: 'center', behavior: 'smooth' });
    } finally {
      submitting = false;
      button.disabled = false;
      button.textContent = 'Submit brief ↗';
      form.removeAttribute('aria-busy');
    }
  });

  byId('download-receipt').addEventListener('click', () => {
    if (!savedReceipt) return;
    const text = [
      'INTERNATIONAL POLICY CONFERENCE', 'Submission receipt', '',
      `Title: ${savedReceipt.title}`, `Receipt code: ${savedReceipt.receiptCode}`,
      `Email: ${savedReceipt.email}`, `Saved: ${dateLabel(savedReceipt.createdAt)}`, '',
      scanDescription(savedReceipt.scan), '',
      `Check your entry at ${new URL('submit.html', window.location.href).href}`,
      'Keep this receipt private. Contact: internationalpolicyconference@gmail.com'
    ].join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'IPC-submission-receipt.txt';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  byId('receipt-form').addEventListener('submit', async event => {
    event.preventDefault();
    const lookupForm = event.currentTarget;
    if (!lookupForm.reportValidity()) return;
    const button = byId('lookup-button');
    button.disabled = true;
    setNotice(byId('lookup-result'), 'Finding your entry…');
    try {
      const data = await request('/api/receipt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ receiptCode: byId('lookup-code').value.trim(), email: byId('lookup-email').value.trim() }) });
      const receipt = data.submission;
      if (!receipt?.title) throw new Error('No entry was returned. Please check your receipt details.');
      setNotice(byId('lookup-result'), `${receipt.title} · ${labels[receipt.status] || 'Received'} · Saved ${dateLabel(receipt.createdAt)}. ${scanDescription(receipt.scan)}`);
    } catch (error) { setNotice(byId('lookup-result'), error.message, true); }
    finally { button.disabled = false; }
  });

  loadConfig();
})();
