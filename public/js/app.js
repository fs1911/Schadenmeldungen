import {
  SECTIONS,
  TITLE,
  LOGO_PLACEHOLDER,
  REQUIRED_LEGEND,
  CONFIRMATION_TEXT,
  CONTACT,
  YES_NO,
  ALLOWED_FILE_TYPES,
  MAX_FILE_BYTES,
  MAX_TEXT_LENGTH,
  matrixValue,
  isValidEmail,
  isValidSwissDate,
  isAllowedFile,
  formatSwissDate,
} from './schema.js';

const CONFIRMATION_MS = 8000;
const IMAGE_MAX_EDGE = 2000;
const IMAGE_QUALITY = 0.82;
const COMPRESS_ABOVE_BYTES = 1024 * 1024;

const MSG_REQUIRED = 'Pflichtfeld';
const MSG_MIN_ONE = 'Bitte mindestens eine Auswahl treffen.';
const FILE_ACCEPT = [...Object.keys(ALLOWED_FILE_TYPES), ...Object.values(ALLOWED_FILE_TYPES).flat()].join(',');

let limits = { maxTotalBytes: 5 * 1024 * 1024, maxFileBytes: MAX_FILE_BYTES };
let submissionId = newId();

// ---------- DOM-Helfer ----------

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false || v === null) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c !== null && c !== undefined) node.append(c);
  return node;
}

function star() {
  return el('span', { class: 'star', 'aria-hidden': 'true', text: '*' });
}

function showStar(item) {
  return item.required && !item.hideStar;
}

function errorSlot(id) {
  return el('p', { class: 'field-error', id: `e-${id}`, role: 'alert', hidden: true });
}

function newId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// ---------- Rendering ----------

let uid = 0;

function renderInput(field, { name = field.id, id = `f-${field.id}` } = {}) {
  const common = { id, name, 'aria-describedby': `e-${field.id}`, 'data-field': field.id };
  switch (field.input) {
    case 'textarea':
      return el('textarea', { ...common, rows: 4, maxlength: MAX_TEXT_LENGTH });
    case 'datetime':
      return el('input', { ...common, type: 'datetime-local' });
    case 'email':
      return el('input', { ...common, type: 'email', autocomplete: 'off', maxlength: 254 });
    case 'tel':
      return el('input', { ...common, type: 'tel', maxlength: 50 });
    case 'date-ch':
      return el('input', {
        ...common,
        type: 'text',
        inputmode: 'numeric',
        placeholder: field.placeholder,
        maxlength: 10,
        value: formatSwissDate(new Date()),
      });
    default:
      return el('input', { ...common, type: 'text', placeholder: field.placeholder, maxlength: MAX_TEXT_LENGTH });
  }
}

function renderField(field, opts = {}) {
  const id = opts.id ?? `f-${field.id}`;
  const input = renderInput(field, { id, name: field.id });
  const label = el('label', { for: id, class: field.strong ? 'label strong' : 'label' }, field.label, showStar(field) ? star() : null);
  const control = field.suffix ? el('div', { class: 'with-suffix' }, input, el('span', { class: 'suffix', text: field.suffix })) : input;
  return el('div', { class: `field field-${field.input}` }, label, control, opts.noError ? null : errorSlot(field.id));
}

function renderVerursacher(block) {
  const radios = block.options.map((opt, i) =>
    el(
      'label',
      { class: 'choice' },
      el('input', { type: 'radio', name: block.id, value: opt.value, id: `f-${block.id}-${i}`, 'data-field': block.id }),
      el('span', { text: opt.value }),
    ),
  );
  const panels = block.options.map((opt) => {
    const panel = el('div', { class: 'conditional', 'data-option': opt.value, hidden: true }, opt.fields.map((f) => renderField(f)));
    setDisabled(panel, true);
    return panel;
  });
  const fs = el(
    'fieldset',
    { class: 'group', id: `f-${block.id}` },
    el('legend', { class: 'sr-only', text: block.label }),
    el('div', { class: 'choice-row' }, showStar(block) ? star() : null, radios),
    errorSlot(block.id),
    panels,
  );
  fs.addEventListener('change', (e) => {
    if (e.target.name !== block.id) return;
    for (const p of panels) {
      const active = p.dataset.option === e.target.value;
      p.hidden = !active;
      setDisabled(p, !active);
    }
  });
  return fs;
}

function setDisabled(container, disabled) {
  for (const input of container.querySelectorAll('input, textarea, select')) input.disabled = disabled;
}

function renderYesNo(block) {
  return el(
    'fieldset',
    { class: 'group yesno', id: `f-${block.id}` },
    el('legend', { class: 'label', text: block.label }),
    el(
      'div',
      { class: 'choice-row' },
      YES_NO.map((v, i) =>
        el(
          'label',
          { class: 'choice' },
          el('input', { type: 'radio', name: block.id, value: v, id: `f-${block.id}-${i}` }),
          el('span', { text: v }),
        ),
      ),
    ),
    errorSlot(block.id),
  );
}

function fileInput(id, name, fieldId) {
  const input = el('input', { type: 'file', id, name, accept: FILE_ACCEPT, 'data-field': fieldId, 'data-file': 'true' });
  const info = el('span', { class: 'file-info' });
  input.addEventListener('change', () => {
    const f = input.files[0];
    info.textContent = f ? `${f.name} (${formatSize(f.size)})` : '';
  });
  return el('div', { class: 'file-control' }, input, info);
}

function renderFile(block) {
  const id = `f-${block.id}`;
  return el(
    'div',
    { class: 'field field-file' },
    el('label', { for: id, class: 'label' }, block.label, showStar(block) ? star() : null),
    fileInput(id, block.id, block.id),
    errorSlot(block.id),
  );
}

function renderFileRepeat(block) {
  const list = el('div', { class: 'repeat-list' });
  const add = el('button', { type: 'button', class: 'add-btn', id: `add-${block.id}` }, el('span', { class: 'plus', text: '+' }), block.addLabel);
  add.addEventListener('click', () => {
    const id = `f-${block.id}-${++uid}`;
    const item = el(
      'div',
      { class: 'field field-file repeat-item' },
      el('label', { for: id, class: 'label', text: 'Foto hochladen' }),
      fileInput(id, block.id, block.id),
    );
    list.append(item);
    item.querySelector('input').focus();
  });
  return el('div', { class: 'repeat', id: `r-${block.id}` }, list, add, errorSlot(block.id));
}

function renderRepeat(block) {
  const list = el('div', { class: 'repeat-list' });
  const addGroup = (focus) => {
    const n = list.children.length;
    const group = el(
      'div',
      { class: 'repeat-group' },
      n > 0 ? el('p', { class: 'repeat-title', text: `${block.addLabel} (${n + 1})` }) : null,
      block.fields.map((f) => renderField(f, { id: n === 0 ? `f-${f.id}` : `f-${f.id}-${++uid}`, noError: n > 0 })),
    );
    list.append(group);
    if (focus) group.querySelector('input').focus();
  };
  addGroup(false);
  const add = el('button', { type: 'button', class: 'add-btn', id: `add-${block.id}` }, el('span', { class: 'plus', text: '+' }), block.addLabel);
  add.addEventListener('click', () => addGroup(true));
  return el('div', { class: 'repeat', id: `r-${block.id}` }, list, add);
}

function renderMatrix(block) {
  const head = el('tr', {}, el('th', { scope: 'col' }), block.columns.map((c) => el('th', { scope: 'col', text: c })));
  const rows = block.rows.map((row) =>
    el(
      'tr',
      {},
      el('th', { scope: 'row', text: row.label }),
      block.columns.map((col, ci) => {
        const value = matrixValue(row.label, col);
        return el(
          'td',
          {},
          el(
            'label',
            { class: 'matrix-cell' },
            el('input', { type: 'checkbox', name: block.id, value, 'aria-label': value, 'data-field': block.id }),
            row.marks[ci] ? el('span', { class: 'star', 'aria-hidden': 'true', text: row.marks[ci] }) : null,
          ),
        );
      }),
    ),
  );
  return el(
    'fieldset',
    { class: 'group', id: `f-${block.id}` },
    el('legend', { class: 'label strong' }, block.label, showStar(block) ? star() : null),
    el('table', { class: 'matrix' }, el('thead', {}, head), el('tbody', {}, rows)),
    errorSlot(block.id),
  );
}

function renderCheckboxes(block) {
  return el(
    'fieldset',
    { class: 'group', id: `f-${block.id}` },
    el('legend', { class: 'label strong' }, block.label, showStar(block) ? star() : null),
    el(
      'div',
      { class: 'choice-col' },
      block.options.map((o, i) =>
        el(
          'label',
          { class: 'choice' },
          el('input', { type: 'checkbox', name: block.id, value: o, id: `f-${block.id}-${i}`, 'data-field': block.id }),
          el('span', { text: o }),
        ),
      ),
    ),
    errorSlot(block.id),
  );
}

function renderBlock(block) {
  switch (block.type) {
    case 'field':
      return renderField(block);
    case 'verursacher':
      return renderVerursacher(block);
    case 'yesno':
      return renderYesNo(block);
    case 'file':
      return renderFile(block);
    case 'filerepeat':
      return renderFileRepeat(block);
    case 'repeat':
      return renderRepeat(block);
    case 'matrix':
      return renderMatrix(block);
    case 'checkboxes':
      return renderCheckboxes(block);
    case 'heading':
      return el('h3', { class: 'subheading' }, block.text, block.required ? star() : null);
    case 'hint':
      return el('p', { class: 'hint', text: block.text });
    default:
      throw new Error(`Unbekannter Blocktyp: ${block.type}`);
  }
}

function renderForm() {
  const body = document.getElementById('form-body');
  body.replaceChildren(
    ...SECTIONS.map((s) =>
      el(
        'section',
        { class: 'section' },
        s.heading ? el('h2', {}, s.heading, s.headingRequired ? star() : null) : null,
        s.blocks.map(renderBlock),
      ),
    ),
  );
}

function renderStatic() {
  document.getElementById('title').textContent = TITLE;
  document.getElementById('logo').textContent = LOGO_PLACEHOLDER;
  document.getElementById('legend-text').textContent = REQUIRED_LEGEND;
  document.getElementById('contact').replaceChildren(
    el('h2', { text: CONTACT.heading }),
    el('p', {}, el('a', { href: CONTACT.phoneHref, text: CONTACT.lines[0] })),
    el('p', {}, el('a', { href: CONTACT.mailHref, text: CONTACT.lines[1] })),
  );
  document.getElementById('confirmation-text').replaceChildren(
    ...CONFIRMATION_TEXT.map((t, i) => el(i === 0 ? 'h2' : 'p', { text: t })),
  );
}

// ---------- Prüfung ----------

function val(form, name) {
  const v = form.elements.namedItem(name);
  if (!v) return '';
  if (v instanceof RadioNodeList) return (v.value ?? '').trim();
  return v.disabled ? '' : (v.value ?? '').trim();
}

function checkedValues(form, name) {
  return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((i) => i.value);
}

function fileInputs(form, name) {
  return [...form.querySelectorAll(`input[type="file"][name="${name}"]`)];
}

function validateField(field, value, errors) {
  if (field.required && !value) errors[field.id] = MSG_REQUIRED;
  else if (value && field.input === 'email' && !isValidEmail(value)) errors[field.id] = 'Bitte eine gültige E-Mail-Adresse eingeben.';
  else if (value && field.input === 'date-ch' && !isValidSwissDate(value)) errors[field.id] = 'Bitte im Format TT.MM.JJJJ eingeben.';
}

function validate(form) {
  const errors = {};
  for (const s of SECTIONS) {
    for (const b of s.blocks) {
      switch (b.type) {
        case 'field':
          validateField(b, val(form, b.id), errors);
          break;
        case 'verursacher': {
          const chosen = b.options.find((o) => o.value === val(form, b.id));
          if (!chosen) errors[b.id] = MSG_REQUIRED;
          else for (const f of chosen.fields) validateField(f, val(form, f.id), errors);
          break;
        }
        case 'matrix':
        case 'checkboxes':
          if (b.required && checkedValues(form, b.id).length === 0) errors[b.id] = MSG_MIN_ONE;
          break;
        case 'file':
        case 'filerepeat':
          for (const input of fileInputs(form, b.id)) {
            const f = input.files[0];
            if (!f) continue;
            if (!isAllowedFile(f.name, f.type)) errors[b.id] = 'Erlaubt sind JPG, PNG, HEIC und PDF.';
          }
          if (b.required && !fileInputs(form, b.id).some((i) => i.files.length > 0)) errors[b.id] = MSG_REQUIRED;
          break;
      }
    }
  }
  return errors;
}

function clearErrors(form) {
  for (const e of form.querySelectorAll('.field-error')) {
    e.hidden = true;
    e.textContent = '';
  }
  for (const i of form.querySelectorAll('[aria-invalid]')) i.removeAttribute('aria-invalid');
  const fe = document.getElementById('form-error');
  fe.hidden = true;
  fe.textContent = '';
}

function showErrors(form, errors) {
  let first = null;
  for (const [id, msg] of Object.entries(errors)) {
    if (id === '_form') continue;
    const slot = document.getElementById(`e-${id}`);
    if (slot) {
      slot.textContent = msg;
      slot.hidden = false;
    }
    const target = form.querySelector(`[data-field="${id}"]:not([disabled])`) ?? document.getElementById(`f-${id}`);
    target?.setAttribute('aria-invalid', 'true');
    const container = slot?.closest('fieldset, .field, .repeat') ?? target;
    if (container && (!first || container.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING)) first = container;
  }
  showFormError(errors._form ?? 'Bitte die markierten Felder prüfen.');
  if (first) {
    first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    first.querySelector('input:not([disabled]), textarea')?.focus({ preventScroll: true });
  }
}

function showFormError(msg) {
  const fe = document.getElementById('form-error');
  fe.textContent = msg;
  fe.hidden = false;
}

// ---------- Dateien ----------

function formatSize(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// Verkleinert grosse Fotos im Browser. HEIC kann nicht jeder Browser lesen – dann bleibt das Original.
async function compressImage(file) {
  if (!file.type.startsWith('image/') || file.size <= COMPRESS_ABOVE_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, IMAGE_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', IMAGE_QUALITY));
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

async function buildFormData(form) {
  const fd = new FormData(form);
  const fileIds = new Set([...form.querySelectorAll('input[type="file"]')].map((i) => i.name));
  for (const id of fileIds) fd.delete(id);
  let total = 0;
  const tooBig = [];
  for (const id of fileIds) {
    for (const input of fileInputs(form, id)) {
      const f = input.files[0];
      if (!f) continue;
      const processed = await compressImage(f);
      if (processed.size > limits.maxFileBytes) tooBig.push(id);
      total += processed.size;
      fd.append(id, processed, processed.name);
    }
  }
  fd.set('submission_id', submissionId);
  return { fd, total, tooBig };
}

// ---------- Absenden ----------

async function onSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const btn = document.getElementById('submit-btn');
  clearErrors(form);

  const errors = validate(form);
  if (Object.keys(errors).length > 0) {
    showErrors(form, errors);
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Wird gesendet …';
  try {
    const { fd, total, tooBig } = await buildFormData(form);
    if (tooBig.length > 0) {
      const errs = {};
      for (const id of tooBig) errs[id] = `Datei zu gross (max. ${formatSize(limits.maxFileBytes)} pro Datei).`;
      showErrors(form, errs);
      return;
    }
    if (total > limits.maxTotalBytes) {
      showFormError(
        `Die Dateien sind zusammen zu gross (${formatSize(total)}, max. ${formatSize(limits.maxTotalBytes)} pro Meldung).`,
      );
      return;
    }

    const res = await fetch('/api/submit', { method: 'POST', body: fd });
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      showConfirmation(form);
      return;
    }
    if (res.status === 422 && body.errors) showErrors(form, body.errors);
    else if (res.status === 413 || res.status === 429) showFormError(body.error ?? 'Die Meldung konnte nicht gesendet werden.');
    else showFormError('Die Schadenmeldung konnte nicht gesendet werden. Bitte erneut versuchen.');
  } catch {
    showFormError('Die Schadenmeldung konnte nicht gesendet werden. Bitte Verbindung prüfen und erneut versuchen.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Absenden';
  }
}

function showConfirmation(form) {
  const box = document.getElementById('confirmation');
  box.hidden = false;
  resetForm(form);
  setTimeout(() => {
    box.hidden = true;
    window.scrollTo({ top: 0 });
  }, CONFIRMATION_MS);
}

function resetForm(form) {
  form.reset();
  renderForm();
  submissionId = newId();
}

async function loadLimits() {
  try {
    const res = await fetch('/api/config');
    if (res.ok) limits = await res.json();
  } catch {
    // Standardwerte bleiben bestehen; der Server prüft ohnehin selbst.
  }
}

renderStatic();
renderForm();
document.getElementById('report-form').addEventListener('submit', onSubmit);
loadLimits();
