/* ============================================================
   TrustMark — Frontend Application Logic
   ============================================================ */

const API = 'http://localhost:8000/api';

// ── State ──────────────────────────────────────────────────
const state = {
  sign:   { file: null },
  verify: { file: null },
  tamper: { file: null },
  detect: { file: null },
  batch:  { files: [] },
};

// ── Client-side validation constants ──────────────────────
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES  = [
  'image/jpeg','image/png','image/webp','image/gif','image/bmp','image/tiff',
  'video/mp4','video/quicktime','video/x-msvideo','video/webm',
  'audio/mpeg','audio/wav','audio/ogg',
  'application/pdf','application/octet-stream',
];

function validateFile(file) {
  if (file.size > MAX_SIZE_BYTES) {
    return `File "${file.name}" is ${formatBytes(file.size)} — exceeds the 50 MB limit.`;
  }
  if (file.type && !ALLOWED_TYPES.includes(file.type)) {
    return `File type "${file.type}" is not supported. Use images, video, audio, or PDF.`;
  }
  return null; // valid
}

// ── Telemetry counters ─────────────────────────────────────
const telemetry = { signed: 0, verified: 0 };
function incTelemetry(key) {
  telemetry[key]++;
  const el = document.getElementById(`tel-${key}`);
  if (el) el.textContent = telemetry[key];
}

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkServerHealth();
  setInterval(checkServerHealth, 10000);
  loadStats();
  setInterval(loadStats, 30000);
});

// ── Server health ──────────────────────────────────────────
async function checkServerHealth() {
  const dot  = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  try {
    const res = await fetch(`${API}/health`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      dot.className  = 'status-dot online';
      text.textContent = 'Backend Online';
    } else {
      throw new Error('Non-OK');
    }
  } catch {
    dot.className  = 'status-dot offline';
    text.textContent = 'Backend Offline';
  }
}

// ── Live stats ─────────────────────────────────────────────
async function loadStats() {
  try {
    const res  = await fetch(`${API}/stats`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return;
    const s = await res.json();

    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('stat-signed',    s.total_signed);
    setEl('stat-verified',  s.total_verified);
    setEl('stat-authentic', s.authentic_count);
    setEl('stat-ai',        s.ai_count);
    setEl('stat-tampered',  s.tampered_count);
    setEl('stat-reupload',  s.re_upload_count);
    setEl('stat-viewed',    s.viewed_count);
  } catch {
    // Silently ignore — stats are non-critical
  }
}

// ── Tab switching ──────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
  });
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));

  document.getElementById(`tab-${name}`).classList.add('active');
  document.getElementById(`tab-${name}`).setAttribute('aria-selected', 'true');
  document.getElementById(`panel-${name}`).classList.add('active');

  if (name === 'history') loadHistory();
}

// ── Drag & drop helpers ────────────────────────────────────
function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}

function handleDrop(e, mode) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  if (mode === 'batch') {
    // Multi-file drop for batch panel
    const files = Array.from(e.dataTransfer.files);
    if (files.length) attachBatchFiles(files);
  } else {
    const file = e.dataTransfer.files[0];
    if (file) attachFile(mode, file);
  }
}

function handleFileSelect(e, mode) {
  const file = e.target.files[0];
  if (file) attachFile(mode, file);
}

function attachFile(mode, file) {
  state[mode].file = file;

  const drop    = document.getElementById(`${mode}Drop`);
  const preview = document.getElementById(`${mode}Preview`);
  const btn     = document.getElementById(`${mode}Btn`);

  drop.classList.add('has-file');
  drop.querySelector('.upload-text').textContent = file.name;
  drop.querySelector('.upload-hint').textContent = formatBytes(file.size);

  // Show image preview if applicable
  preview.classList.remove('hidden');
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = ev => {
      preview.innerHTML = `
        <img src="${ev.target.result}" alt="Preview of ${escHtml(file.name)}" />
        <div class="file-info">
          <div class="file-name">${escHtml(file.name)}</div>
          <div class="file-size">${formatBytes(file.size)} • ${file.type}</div>
        </div>`;
    };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = `
      <span style="font-size:2rem">🎬</span>
      <div class="file-info">
        <div class="file-name">${escHtml(file.name)}</div>
        <div class="file-size">${formatBytes(file.size)} • ${file.type}</div>
      </div>`;
  }

  if (btn) btn.disabled = false;

  // Clear previous results
  const result = document.getElementById(`${mode}Result`);
  if (result) result.classList.add('hidden');
}

// ── SIGN ──────────────────────────────────────────────────
async function signFile() {
  const { file } = state.sign;
  if (!file) return;

  const btn = document.getElementById('signBtn');
  const resultEl = document.getElementById('signResult');

  // Client-side validation
  const validationErr = validateFile(file);
  if (validationErr) {
    resultEl.classList.remove('hidden');
    resultEl.innerHTML = errorCard('Invalid File', validationErr);
    return;
  }

  setLoading(btn, '🔏', 'Signing…');

  try {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('device_id', document.getElementById('deviceId').value || 'web-upload');
    fd.append('note', document.getElementById('signNote').value || '');

    const res = await fetch(`${API}/sign`, { method: 'POST', body: fd });
    const data = await res.json();

    resultEl.classList.remove('hidden');
    if (!res.ok) {
      // Surface HTTP-level errors (413 size, 415 MIME) cleanly
      resultEl.innerHTML = errorCard(
        `Upload Error (HTTP ${res.status})`,
        data.detail || JSON.stringify(data)
      );
      return;
    }
    if (data.status === 'signed' || data.status === 'already_signed') {
      incTelemetry('signed');
      loadStats(); // refresh dashboard counters
      const m = data.manifest;
      const isNew = data.status === 'signed';

      // For re-uploads, find the latest RE_UPLOADED event for the badge
      const latestEvent = !isNew && data.custody_chain
        ? data.custody_chain.filter(e => e.action === 'RE_UPLOADED').pop()
        : null;

      resultEl.innerHTML = `
        <div class="verdict-card signed">
          <div class="verdict-header">
            <div class="verdict-emoji">${isNew ? '🔏' : '♻️'}</div>
            <div>
              <div class="verdict-title" style="color:var(--accent-hi)">
                ${isNew ? 'Signed & Secured' : 'Already Signed — Activity Logged'}
              </div>
              <div class="verdict-subtitle">
                ${isNew
                  ? 'Ed25519 signature created and stored'
                  : 'RE_UPLOADED event appended to chain of custody'}
              </div>
            </div>
          </div>
          <p class="verdict-message">
            ${isNew
              ? 'Your file now has a cryptographic fingerprint. Anyone who verifies this exact file against our system will receive a green "Authentic" badge. Any modification — even a single pixel — will cause verification to fail.'
              : `An identical file was already in our system. A <strong>RE_UPLOADED</strong> event has been appended to its chain of custody at <em>${latestEvent ? formatDate(latestEvent.timestamp) : 'now'}</em>. The original manifest is returned below.`}
          </p>
          <div class="hash-display" title="SHA-256 fingerprint of your file">
            SHA-256: ${m.file_hash}
          </div>
          <details class="manifest-details" ${!isNew ? 'open' : ''}>
            <summary>📄 View Full Manifest</summary>
            <table class="manifest-table">
              <tr><td>File</td><td>${escHtml(m.original_filename || m.filename)}</td></tr>
              <tr><td>Hash</td><td>${m.file_hash}</td></tr>
              <tr><td>Algorithm</td><td>${m.hash_algorithm || 'SHA-256'}</td></tr>
              <tr><td>Timestamp</td><td>${formatDate(m.timestamp)}</td></tr>
              <tr><td>Device / Source</td><td>${escHtml(m.device_id)}</td></tr>
              <tr><td>Public Key</td><td>${truncate(m.public_key, 32)}…</td></tr>
              <tr><td>Signature</td><td>${truncate(m.signature, 32)}…</td></tr>
              ${m.note ? `<tr><td>Note</td><td>${escHtml(m.note)}</td></tr>` : ''}
            </table>
            ${renderChain(data.custody_chain)}
          </details>
        </div>`;
    } else {
      resultEl.innerHTML = errorCard('Signing Failed', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    resultEl.classList.remove('hidden');
    resultEl.innerHTML = errorCard('Network Error', err.message);
  } finally {
    resetLoading(btn, '🔏', 'Sign File');
  }
}

// ── VERIFY ────────────────────────────────────────────────
async function verifyFile() {
  const { file } = state.verify;
  if (!file) return;

  const btn = document.getElementById('verifyBtn');
  const resultEl = document.getElementById('verifyResult');

  const validationErr = validateFile(file);
  if (validationErr) {
    resultEl.classList.remove('hidden');
    resultEl.innerHTML = errorCard('Invalid File', validationErr);
    return;
  }

  setLoading(btn, '🔍', 'Verifying…');

  try {
    const fd = new FormData();
    fd.append('file', file);

    const res = await fetch(`${API}/verify`, { method: 'POST', body: fd });
    const data = await res.json();

    resultEl.classList.remove('hidden');
    incTelemetry('verified');
    resultEl.innerHTML = renderVerifyResult(data);
  } catch (err) {
    resultEl.classList.remove('hidden');
    resultEl.innerHTML = errorCard('Network Error', err.message);
  } finally {
    resetLoading(btn, '🔍', 'Verify File');
  }
}

// ── BATCH VERIFY ──────────────────────────────────────────
function handleBatchFileSelect(e) {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  attachBatchFiles(files);
}

function attachBatchFiles(files) {
  state.batch.files = files;
  const listEl = document.getElementById('batchFileList');
  const btn    = document.getElementById('batchBtn');
  const validCount = files.filter(f => !validateFile(f)).length;

  if (listEl) {
    listEl.innerHTML = files.map((f) => {
      const err = validateFile(f);
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;
                    padding:.35rem .5rem;border-bottom:1px solid var(--border);font-size:.8rem;">
          <span style="${err ? 'color:var(--red-light)' : 'color:var(--text-primary)'}">
            ${err ? '⚠️ ' : '📄 '}${escHtml(f.name)}
          </span>
          <span style="color:var(--text-dim);font-size:.75rem;">
            ${err ? escHtml(err) : formatBytes(f.size)}
          </span>
        </div>`;
    }).join('');

    // Show a summary warning if some files are invalid
    if (validCount < files.length) {
      listEl.insertAdjacentHTML('afterbegin', `
        <div style="padding:.4rem .6rem;background:rgba(251,191,36,.08);
                    border-bottom:1px solid rgba(251,191,36,.25);font-size:.78rem;
                    color:var(--amber-light);">
          ⚠️ ${files.length - validCount} file(s) will be skipped (invalid type or size).
          ${validCount} valid file(s) will be submitted.
        </div>`);
    }
  }
  if (btn) btn.disabled = validCount === 0;
}

async function batchVerify() {
  const allFiles = state.batch.files;
  if (!allFiles.length) return;

  // Filter out client-side invalid files before submission
  const files = allFiles.filter(f => !validateFile(f));
  if (!files.length) {
    const resultEl = document.getElementById('batchResult');
    resultEl.classList.remove('hidden');
    resultEl.innerHTML = errorCard('No Valid Files', 'All selected files failed client-side validation. Check file types and sizes.');
    return;
  }

  const btn      = document.getElementById('batchBtn');
  const resultEl = document.getElementById('batchResult');
  setLoading(btn, '📦', `Verifying ${files.length} file${files.length > 1 ? 's' : ''}…`);

  try {
    const fd = new FormData();
    for (const f of files) fd.append('files', f);

    const res  = await fetch(`${API}/batch-verify`, { method: 'POST', body: fd });
    const data = await res.json();

    if (!res.ok) {
      resultEl.classList.remove('hidden');
      resultEl.innerHTML = errorCard(`Server Error ${res.status}`, data.detail || JSON.stringify(data));
      return;
    }

    resultEl.classList.remove('hidden');
    resultEl.innerHTML = renderBatchResults(data);
    // Refresh stats after batch op
    loadStats();
  } catch (err) {
    resultEl.classList.remove('hidden');
    resultEl.innerHTML = errorCard('Network Error', err.message);
  } finally {
    resetLoading(btn, '📦', 'Batch Verify');
  }
}

function renderBatchResults(data) {
  const { summary, results, total } = data;
  const summaryHtml = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.75rem;margin-bottom:1.25rem;">
      <div style="background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.25);border-radius:10px;
                  padding:.75rem;text-align:center;">
        <div style="font-size:1.6rem;font-weight:800;color:var(--emerald-light)">${summary.authentic}</div>
        <div style="font-size:.7rem;color:var(--text-dim);margin-top:.2rem;">Authentic</div>
      </div>
      <div style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:10px;
                  padding:.75rem;text-align:center;">
        <div style="font-size:1.6rem;font-weight:800;color:var(--red-light)">${summary.tampered}</div>
        <div style="font-size:.7rem;color:var(--text-dim);margin-top:.2rem;">Tampered</div>
      </div>
      <div style="background:rgba(139,92,246,.08);border:1px solid rgba(139,92,246,.25);border-radius:10px;
                  padding:.75rem;text-align:center;">
        <div style="font-size:1.6rem;font-weight:800;color:var(--purple)">${summary.ai_checked}</div>
        <div style="font-size:.7rem;color:var(--text-dim);margin-top:.2rem;">AI Checked</div>
      </div>
      <div style="background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.25);border-radius:10px;
                  padding:.75rem;text-align:center;">
        <div style="font-size:1.6rem;font-weight:800;color:var(--amber-light)">${summary.errors}</div>
        <div style="font-size:.7rem;color:var(--text-dim);margin-top:.2rem;">Errors</div>
      </div>
    </div>`;

  const rows = results.map(r => {
    let icon, color, label;
    if (r.verdict === 'AUTHENTIC')             { icon='✅'; color='var(--emerald-light)'; label='Authentic'; }
    else if (r.verdict === 'SIGNATURE_BROKEN') { icon='💔'; color='var(--red-light)';    label='Sig Broken'; }
    else if (r.verdict === 'AI_DETECTION_FALLBACK') { icon='🤖'; color='var(--purple)'; label='AI Checked'; }
    else if (r.status === 'rejected')          { icon='⛔'; color='var(--amber-light)';  label='Rejected'; }
    else                                       { icon='❓'; color='var(--text-dim)';      label=r.status || '?'; }

    const conf = r.detection?.confidence != null
      ? ` <span style="color:var(--text-dim);font-size:.75rem;">· AI ${r.detection.confidence.toFixed(0)}%</span>`
      : '';

    return `
      <div style="display:flex;align-items:center;gap:.75rem;padding:.5rem .25rem;
                  border-bottom:1px solid var(--border);">
        <span style="width:2rem;text-align:center;font-size:1.1rem;">${icon}</span>
        <span style="flex:1;font-size:.82rem;color:var(--text-primary);word-break:break-all;">
          ${escHtml(r.filename)}
        </span>
        <span style="font-size:.78rem;font-weight:700;color:${color};white-space:nowrap;">
          ${label}${conf}
        </span>
        ${r.error ? `<span style="font-size:.72rem;color:var(--red-light);" title="${escHtml(r.error)}">⚠</span>` : ''}
      </div>`;
  }).join('');

  return `
    <div class="verdict-card" style="border-color:var(--border);">
      <div class="verdict-header" style="margin-bottom:1rem;">
        <div class="verdict-emoji">📦</div>
        <div>
          <div class="verdict-title" style="color:var(--indigo-light);">Batch Verification Complete</div>
          <div class="verdict-subtitle">${total} file${total !== 1 ? 's' : ''} processed</div>
        </div>
      </div>
      ${summaryHtml}
      <div style="font-size:.75rem;font-weight:700;color:var(--text-dim);margin-bottom:.5rem;
                  text-transform:uppercase;letter-spacing:.05em;">Results</div>
      ${rows}
    </div>`;
}

function renderVerifyResult(data) {
  if (data.verdict === 'AUTHENTIC') {
    const m = data.manifest;
    return `
      <div class="verdict-card authentic">
        <div class="verdict-header">
          <div class="verdict-emoji">✅</div>
          <div>
            <div class="verdict-title" style="color:var(--emerald-light)">Authentic & Unaltered</div>
            <div class="verdict-subtitle">Cryptographic proof — not a guess</div>
          </div>
        </div>
        <p class="verdict-message">${data.message}</p>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem;">
          <span class="chip green">✓ Hash Match</span>
          <span class="chip green">✓ Signature Valid</span>
          <span class="chip blue">Ed25519</span>
          <span class="chip blue">SHA-256</span>
        </div>
        <div class="hash-display">SHA-256: ${data.file_hash}</div>
        <details class="manifest-details">
          <summary>📄 View Manifest & Chain of Custody</summary>
          <table class="manifest-table">
            <tr><td>Signed by</td><td>${escHtml(m.device_id)}</td></tr>
            <tr><td>Signed at</td><td>${formatDate(m.timestamp)}</td></tr>
            <tr><td>File</td><td>${escHtml(m.filename)}</td></tr>
          </table>
          ${renderChain(data.custody_chain)}
        </details>
      </div>`;
  }

  if (data.verdict === 'AI_DETECTION_FALLBACK') {
    return renderAIResult(data.detection, data.file_hash, true);
  }

  if (data.verdict === 'SIGNATURE_BROKEN') {
    return `
      <div class="verdict-card tampered">
        <div class="verdict-header">
          <div class="verdict-emoji">💔</div>
          <div>
            <div class="verdict-title" style="color:var(--red-light)">Signature Invalid</div>
            <div class="verdict-subtitle">Manifest found but signature is broken</div>
          </div>
        </div>
        <p class="verdict-message">${data.message}</p>
        <div class="hash-display">SHA-256: ${data.file_hash}</div>
      </div>`;
  }

  return errorCard('Unexpected response', JSON.stringify(data));
}

// ── TAMPER DEMO ───────────────────────────────────────────
async function tamperDemo() {
  const { file } = state.tamper;
  if (!file) return;

  const btn = document.getElementById('tamperBtn');
  const resultEl = document.getElementById('tamperResult');

  setLoading(btn, '⚠️', 'Checking…');

  // Animate steps
  document.getElementById('tamperStep2').classList.add('done');
  document.getElementById('tamperStep3').classList.add('done');

  try {
    const fd = new FormData();
    fd.append('file', file);

    const res = await fetch(`${API}/tamper-demo`, { method: 'POST', body: fd });
    const data = await res.json();

    resultEl.classList.remove('hidden');

    if (data.verdict === 'AUTHENTIC' || data.status === 'hash_matches') {
      resultEl.innerHTML = `
        <div class="verdict-card authentic">
          <div class="verdict-header">
            <div class="verdict-emoji">✅</div>
            <div>
              <div class="verdict-title" style="color:var(--emerald-light)">No Tampering Detected</div>
              <div class="verdict-subtitle">Hash matches a signed manifest exactly</div>
            </div>
          </div>
          <p class="verdict-message">${data.message}</p>
          <div class="hash-display">SHA-256: ${data.file_hash}</div>
        </div>`;
    } else {
      // Tampered!
      const det = data.detection || {};
      resultEl.innerHTML = `
        <div class="verdict-card tampered">
          <div class="verdict-header">
            <div class="verdict-emoji">🚨</div>
            <div>
              <div class="verdict-title" style="color:var(--red-light)">Tampered / Not Signed</div>
              <div class="verdict-subtitle">Hash does not match any signed manifest</div>
            </div>
          </div>
          <p class="verdict-message">${data.message}</p>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem;">
            <span class="chip red">✗ Hash Mismatch</span>
            <span class="chip red">✗ No Valid Manifest</span>
          </div>
          <div class="hash-display">New SHA-256: ${data.file_hash}</div>
          ${det.label ? `
          <div style="margin-top:1rem;">
            <div style="font-size:.8rem;font-weight:700;color:var(--text-dim);margin-bottom:.5rem;text-transform:uppercase;letter-spacing:.05em;">AI Supplementary Analysis</div>
            ${renderAIResult(det, data.file_hash, false)}
          </div>` : ''}
        </div>`;
    }
  } catch (err) {
    resultEl.classList.remove('hidden');
    resultEl.innerHTML = errorCard('Network Error', err.message);
  } finally {
    resetLoading(btn, '⚠️', 'Check for Tampering');
  }
}

// ── DETECT ────────────────────────────────────────────────
async function detectFile() {
  const { file } = state.detect;
  if (!file) return;

  const btn = document.getElementById('detectBtn');
  const resultEl = document.getElementById('detectResult');

  setLoading(btn, '🤖', 'Analysing…');

  try {
    const fd = new FormData();
    fd.append('file', file);

    const res = await fetch(`${API}/verify`, { method: 'POST', body: fd });
    const data = await res.json();

    resultEl.classList.remove('hidden');

    if (data.verdict === 'AI_DETECTION_FALLBACK') {
      resultEl.innerHTML = renderAIResult(data.detection, data.file_hash, true);
    } else if (data.verdict === 'AUTHENTIC') {
      resultEl.innerHTML = `
        <div class="verdict-card authentic">
          <div class="verdict-header">
            <div class="verdict-emoji">🔏</div>
            <div>
              <div class="verdict-title" style="color:var(--emerald-light)">Signed by TrustMark</div>
              <div class="verdict-subtitle">AI detection skipped — cryptographic proof available</div>
            </div>
          </div>
          <p class="verdict-message">
            This file has a valid TrustMark signature, which is stronger than AI detection.
            Use the Verify tab for full provenance details.
          </p>
          <div class="hash-display">SHA-256: ${data.file_hash}</div>
        </div>`;
    } else {
      resultEl.innerHTML = errorCard('Unexpected response', JSON.stringify(data));
    }
  } catch (err) {
    resultEl.classList.remove('hidden');
    resultEl.innerHTML = errorCard('Network Error', err.message);
  } finally {
    resetLoading(btn, '🤖', 'Run AI Analysis');
  }
}

// ── AI result renderer ────────────────────────────────────
function renderAIResult(det, fileHash, standalone) {
  if (!det || det.status === 'model_unavailable') {
    const reason = det?.explanation || 'Model unavailable';
    return `
      <div class="verdict-card warning">
        <div class="verdict-header">
          <div class="verdict-emoji">⚙️</div>
          <div>
            <div class="verdict-title" style="color:var(--amber-light)">AI Model Not Available</div>
            <div class="verdict-subtitle">Install torch to enable detection</div>
          </div>
        </div>
        <p class="verdict-message">${escHtml(reason)}</p>
        <div class="info-banner" style="margin-top:.75rem;">
          <span class="info-icon">ℹ️</span>
          <span>Run <code style="font-family:var(--mono);font-size:.8rem;background:rgba(255,255,255,.06);padding:2px 5px;border-radius:4px;">pip install torch torchvision</code> then restart the backend to enable the AI detector.</span>
        </div>
        ${fileHash ? `<div class="hash-display" style="margin-top:.75rem;">SHA-256: ${fileHash}</div>` : ''}
      </div>`;
  }

  const isFake = det.label === 'Fake';
  const conf   = det.confidence ?? 0;
  const confClass = conf >= 75 ? (isFake ? 'fake' : 'real') : 'medium';

  const cardClass = isFake ? 'ai-fallback' : 'authentic';
  const emoji     = det.status === 'error' ? '⚠️' : (isFake ? '🤖' : '📷');
  const titleColor= isFake ? 'var(--purple)' : 'var(--emerald-light)';
  const title     = det.status === 'error'
    ? 'Detection Error'
    : (isFake ? 'Likely AI-Generated / Synthetic' : 'Likely Authentic Photo');

  return `
    <div class="verdict-card ${cardClass}" ${standalone ? '' : 'style="margin:0;border-left:none;border-top:1px solid var(--border)"'}>
      <div class="verdict-header">
        <div class="verdict-emoji">${emoji}</div>
        <div>
          <div class="verdict-title" style="color:${titleColor}">${title}</div>
          <div class="verdict-subtitle">
            AI Analysis — best-effort estimate, not a guarantee
          </div>
        </div>
      </div>
      <p class="verdict-message">${escHtml(det.explanation || '')}</p>

      ${det.confidence != null ? `
      <div class="confidence-block">
        <div class="confidence-label">
          <span>${isFake ? 'Fake Probability' : 'Real Probability'}</span>
          <span>${conf.toFixed(1)}%</span>
        </div>
        <div class="confidence-bar-track">
          <div class="confidence-bar-fill ${confClass}"
               style="width:${conf}%;" role="progressbar"
               aria-valuenow="${conf}" aria-valuemin="0" aria-valuemax="100">
          </div>
        </div>
      </div>

      <div style="display:flex;gap:.75rem;margin-bottom:.75rem;">
        <div style="flex:1;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:8px;padding:.6rem;text-align:center;">
          <div style="font-size:1.2rem;font-weight:800;color:var(--red-light)">${(det.fake_probability ?? 0).toFixed(1)}%</div>
          <div style="font-size:.7rem;color:var(--text-dim);margin-top:.1rem;">Fake Score</div>
        </div>
        <div style="flex:1;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);border-radius:8px;padding:.6rem;text-align:center;">
          <div style="font-size:1.2rem;font-weight:800;color:var(--emerald-light)">${(det.real_probability ?? 0).toFixed(1)}%</div>
          <div style="font-size:.7rem;color:var(--text-dim);margin-top:.1rem;">Real Score</div>
        </div>
      </div>` : ''}

      <div class="info-banner">
        <span class="info-icon">⚠️</span>
        <span>
          This is a <strong>probabilistic estimate</strong> from
          <code style="font-family:var(--mono);font-size:.78rem;">${escHtml(det.model || '')}</code>.
          It is not a definitive verdict. Content without a TrustMark signature cannot be
          cryptographically verified as authentic.
        </span>
      </div>

      ${fileHash ? `<div class="hash-display" style="margin-top:.75rem;">SHA-256: ${fileHash}</div>` : ''}
    </div>`;
}

// ── HISTORY ───────────────────────────────────────────────
async function loadHistory() {
  try {
    const [histRes, manifestRes] = await Promise.all([
      fetch(`${API}/history?limit=30`),
      fetch(`${API}/manifests`),
    ]);
    const history   = await histRes.json();
    const manifests = await manifestRes.json();

    renderVerificationHistory(history);
    renderManifestList(manifests);
  } catch (err) {
    document.getElementById('verificationHistory').innerHTML =
      `<p class="empty-state">Failed to load history: ${escHtml(err.message)}</p>`;
  }
}

function renderVerificationHistory(items) {
  const el = document.getElementById('verificationHistory');
  if (!items.length) {
    el.innerHTML = '<p class="empty-state">No verifications yet.</p>';
    return;
  }
  el.innerHTML = items.map(item => {
    const vtype = item.verdict_type;
    let cls, label, icon;
    if (item.verdict === 'AUTHENTIC') { cls = 'authentic'; label = 'Authentic'; icon = '✅'; }
    else if (item.verdict.includes('TAMPER')) { cls = 'tampered'; label = 'Tampered'; icon = '🚨'; }
    else if (vtype === 'ai_detection') { cls = 'fallback'; label = 'AI Analysed'; icon = '🤖'; }
    else { cls = 'fallback'; label = item.verdict; icon = '❓'; }

    const conf = item.confidence != null ? ` · ${item.confidence.toFixed(0)}%` : '';

    return `
      <div class="history-item">
        <span class="history-verdict ${cls}">${icon} ${label}${conf}</span>
        <span class="history-filename">${escHtml(item.filename || '(unknown)')}</span>
        <span class="history-time">${timeAgo(item.created_at)}</span>
      </div>`;
  }).join('');
}

function renderManifestList(manifests) {
  const el = document.getElementById('manifestList');
  if (!manifests.length) {
    el.innerHTML = '<p class="empty-state">No signed files yet.</p>';
    return;
  }
  el.innerHTML = manifests.map(m => `
    <div class="history-item" style="cursor:pointer" onclick="loadChain(${m.id})"
         title="Click to view chain of custody">
      <span class="history-verdict signed">🔏 Signed</span>
      <span class="history-filename">${escHtml(m.filename)}</span>
      <span class="history-time">${timeAgo(m.created_at)}</span>
    </div>`).join('');
}

async function loadChain(manifestId) {
  try {
    const res = await fetch(`${API}/manifests/${manifestId}/chain`);
    const chain = await res.json();

    const section = document.getElementById('chainSection');
    const tl = document.getElementById('chainTimeline');
    section.style.display = 'block';

    tl.innerHTML = chain.map(ev => `
      <div class="timeline-event">
        <div class="tl-dot"></div>
        <div class="tl-content">
          <div class="tl-action">${escHtml(ev.action)}</div>
          <div class="tl-meta">
            by ${escHtml(ev.actor)} · ${formatDate(ev.timestamp)}
            ${ev.note ? `<br><em>${escHtml(ev.note)}</em>` : ''}
          </div>
        </div>
      </div>`).join('');

    // Chart
    renderChainChart(chain);
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch {
    // ignore
  }
}

function renderChain(chain) {
  if (!chain || !chain.length) return '';

  const ACTION_META = {
    SIGNED:      { icon: '🔏', color: 'var(--indigo-light)',  label: 'SIGNED' },
    RE_UPLOADED: { icon: '♻️', color: 'var(--amber-light)',  label: 'RE-UPLOADED' },
    VIEWED:      { icon: '👁️', color: 'var(--emerald-light)', label: 'VIEWED' },
    TRANSFERRED: { icon: '🔀', color: 'var(--purple)',         label: 'TRANSFERRED' },
  };

  return `
    <div style="margin-top:.75rem;">
      <div style="font-size:.75rem;font-weight:700;color:var(--text-dim);margin-bottom:.5rem;text-transform:uppercase;letter-spacing:.05em;">Chain of Custody (${chain.length} event${chain.length !== 1 ? 's' : ''})</div>
      ${chain.map(ev => {
        const meta = ACTION_META[ev.action] || { icon: '📋', color: 'var(--text-dim)', label: ev.action };
        return `
          <div style="display:flex;gap:.6rem;align-items:flex-start;padding:.4rem 0;border-bottom:1px solid var(--border);font-size:.78rem;">
            <span style="font-size:.9rem;min-width:1.2rem;">${meta.icon}</span>
            <span style="color:${meta.color};font-weight:700;white-space:nowrap;">${meta.label}</span>
            <span style="color:var(--text-dim);">
              · ${escHtml(ev.actor)} · ${formatDate(ev.timestamp)}
              ${ev.note ? `<br><em style="color:var(--text-dim);font-size:.74rem;">${escHtml(ev.note)}</em>` : ''}
            </span>
          </div>`;
      }).join('')}
    </div>`;
}

let chainChartInstance = null;
function renderChainChart(chain) {
  const canvas = document.getElementById('chainChart');
  if (chainChartInstance) chainChartInstance.destroy();
  chainChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: chain.map(e => formatDate(e.timestamp, true)),
      datasets: [{
        label: 'Custody Events',
        data: chain.map((_, i) => i + 1),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.12)',
        pointBackgroundColor: '#818cf8',
        pointRadius: 6,
        tension: 0.3,
        fill: true,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => chain[ctx.dataIndex].action,
          },
        },
      },
      scales: {
        y: {
          ticks: { stepSize: 1, color: '#64748b' },
          grid: { color: 'rgba(255,255,255,0.05)' },
        },
        x: {
          ticks: { color: '#64748b', maxRotation: 45 },
          grid: { color: 'rgba(255,255,255,0.05)' },
        },
      },
    },
  });
}

// ── Utilities ─────────────────────────────────────────────

function setLoading(btn, icon, label) {
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> ${label}`;
}

function resetLoading(btn, icon, label) {
  btn.disabled = false;
  btn.innerHTML = `<span class="btn-icon">${icon}</span> ${label}`;
}

function errorCard(title, detail) {
  return `
    <div class="verdict-card tampered">
      <div class="verdict-header">
        <div class="verdict-emoji">❌</div>
        <div>
          <div class="verdict-title" style="color:var(--red-light)">${escHtml(title)}</div>
          <div class="verdict-subtitle">Something went wrong</div>
        </div>
      </div>
      <p class="verdict-message" style="font-family:var(--mono);font-size:.75rem;white-space:pre-wrap;word-break:break-all;">${escHtml(detail)}</p>
    </div>`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) : str;
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso, short = false) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (short) return d.toLocaleTimeString();
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function timeAgo(iso) {
  if (!iso) return '';
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch {
    return iso;
  }
}
