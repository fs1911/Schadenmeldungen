// Auswertung und Prüfung einer abgesendeten Schadenmeldung sowie Aufbau der E-Mail-Inhalte.
import {
  SECTIONS,
  TITLE,
  YES_NO,
  MAX_FILE_BYTES,
  MAX_TEXT_LENGTH,
  PLANS_TRIGGER,
  PLANS_NOTE,
  matrixValue,
  isValidEmail,
  isValidSwissDate,
  isAllowedFile,
  fileExtension,
} from '../public/js/schema.js';

export const HONEYPOT_FIELD = 'website';
export const SUBMISSION_ID_FIELD = 'submission_id';

const MSG_REQUIRED = 'Pflichtfeld';
const MSG_MIN_ONE = 'Bitte mindestens eine Auswahl treffen.';

function text(formData, id) {
  const v = formData.get(id);
  return typeof v === 'string' ? v.trim() : '';
}

function texts(formData, id) {
  return formData.getAll(id).filter((v) => typeof v === 'string').map((v) => v.trim());
}

function files(formData, id) {
  return formData.getAll(id).filter((v) => typeof v === 'object' && v !== null && v.size > 0);
}

function allFields(block) {
  if (block.type === 'verursacher') return block.options.flatMap((o) => o.fields);
  if (block.type === 'repeat') return block.fields;
  if (block.type === 'field') return [block];
  return [];
}

// Liest die Formulardaten gemäss Schema. Unbekannte Felder werden ignoriert.
export function parseSubmission(formData) {
  const values = {};
  const uploads = {};
  for (const section of SECTIONS) {
    for (const block of section.blocks) {
      switch (block.type) {
        case 'field':
          values[block.id] = text(formData, block.id);
          break;
        case 'yesno':
          values[block.id] = text(formData, block.id);
          break;
        case 'verursacher':
          values[block.id] = text(formData, block.id);
          for (const f of allFields(block)) values[f.id] = text(formData, f.id);
          break;
        case 'repeat':
          for (const f of block.fields) values[f.id] = texts(formData, f.id);
          break;
        case 'matrix':
        case 'checkboxes':
          values[block.id] = texts(formData, block.id);
          break;
        case 'file':
        case 'filerepeat':
          uploads[block.id] = files(formData, block.id);
          break;
      }
    }
  }
  return {
    values,
    uploads,
    honeypot: text(formData, HONEYPOT_FIELD),
    submissionId: text(formData, SUBMISSION_ID_FIELD),
  };
}

function checkField(field, value, errors) {
  const list = Array.isArray(value) ? value : [value];
  if (list.some((v) => v.length > MAX_TEXT_LENGTH)) errors[field.id] = `Maximal ${MAX_TEXT_LENGTH} Zeichen.`;
  if (field.required && !value) {
    errors[field.id] = MSG_REQUIRED;
    return;
  }
  if (!value) return;
  if (field.input === 'email' && !isValidEmail(value)) errors[field.id] = 'Bitte eine gültige E-Mail-Adresse eingeben.';
  if (field.input === 'date-ch' && !isValidSwissDate(value)) errors[field.id] = 'Bitte im Format TT.MM.JJJJ eingeben.';
  if (field.input === 'datetime' && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    errors[field.id] = 'Bitte Datum und Uhrzeit auswählen.';
  }
}

// Prüft Dateityp anhand der ersten Bytes (Dateiendung und MIME-Typ allein sind fälschbar)
export function sniffFileType(bytes) {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  if (b.length >= 5 && String.fromCharCode(...b.slice(0, 5)) === '%PDF-') return 'pdf';
  if (b.length >= 12 && String.fromCharCode(...b.slice(4, 8)) === 'ftyp') {
    const brand = String.fromCharCode(...b.slice(8, 12));
    if (['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1'].includes(brand)) return 'heic';
  }
  return null;
}

const SNIFF_BY_EXT = { '.jpg': 'jpeg', '.jpeg': 'jpeg', '.png': 'png', '.pdf': 'pdf', '.heic': 'heic', '.heif': 'heic' };

export async function validateSubmission(parsed, { maxTotalBytes }) {
  const { values, uploads } = parsed;
  const errors = {};

  for (const section of SECTIONS) {
    for (const block of section.blocks) {
      switch (block.type) {
        case 'field':
          checkField(block, values[block.id], errors);
          break;
        case 'yesno':
          if (values[block.id] && !YES_NO.includes(values[block.id])) errors[block.id] = 'Ungültige Auswahl.';
          break;
        case 'verursacher': {
          const chosen = block.options.find((o) => o.value === values[block.id]);
          if (!values[block.id]) errors[block.id] = MSG_REQUIRED;
          else if (!chosen) errors[block.id] = 'Ungültige Auswahl.';
          else for (const f of chosen.fields) checkField(f, values[f.id], errors);
          break;
        }
        case 'repeat':
          for (const f of block.fields) checkField(f, values[f.id], errors);
          break;
        case 'matrix': {
          const allowed = block.rows.flatMap((r) => block.columns.map((c) => matrixValue(r.label, c)));
          const v = values[block.id];
          if (v.some((x) => !allowed.includes(x))) errors[block.id] = 'Ungültige Auswahl.';
          else if (block.required && v.length === 0) errors[block.id] = MSG_MIN_ONE;
          break;
        }
        case 'checkboxes': {
          const v = values[block.id];
          if (v.some((x) => !block.options.includes(x))) errors[block.id] = 'Ungültige Auswahl.';
          else if (block.required && v.length === 0) errors[block.id] = MSG_MIN_ONE;
          break;
        }
        case 'file':
        case 'filerepeat':
          if (block.required && uploads[block.id].length === 0) errors[block.id] = MSG_REQUIRED;
          if (block.type === 'file' && uploads[block.id].length > 1) errors[block.id] = 'Nur eine Datei pro Feld.';
          break;
      }
    }
  }

  let total = 0;
  for (const [id, list] of Object.entries(uploads)) {
    for (const file of list) {
      total += file.size;
      const name = file.name || '';
      if (!isAllowedFile(name, file.type)) {
        errors[id] = 'Erlaubt sind JPG, PNG, HEIC und PDF.';
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        errors[id] = `Datei zu gross (max. ${MAX_FILE_BYTES / 1024 / 1024} MB pro Datei).`;
        continue;
      }
      const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
      if (sniffFileType(head) !== SNIFF_BY_EXT[fileExtension(name)]) {
        errors[id] = 'Dateiinhalt passt nicht zum Dateityp.';
      }
    }
  }
  if (total > maxTotalBytes) {
    errors._form = `Die Dateien sind zusammen zu gross (max. ${formatMb(maxTotalBytes)} pro Meldung).`;
  }

  return errors;
}

export function formatMb(bytes) {
  return `${Math.round((bytes / 1024 / 1024) * 10) / 10} MB`;
}

export function plansTriggered(values) {
  return values[PLANS_TRIGGER.field]?.includes(PLANS_TRIGGER.value) ?? false;
}

function formatDateTime(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  return m ? `${m[3]}.${m[2]}.${m[1]} ${m[4]}:${m[5]}` : value;
}

function displayValue(field, value) {
  if (field.input === 'datetime') return formatDateTime(value);
  if (field.suffix && value) return `${value} ${field.suffix}`;
  return value;
}

// Liefert die Meldung als geordnete Liste von Abschnitten mit {label, value}-Zeilen (Reihenfolge der Vorlage).
export function reportRows(values, uploads) {
  const out = [];
  for (const section of SECTIONS) {
    const rows = [];
    for (const block of section.blocks) {
      switch (block.type) {
        case 'field':
          rows.push({ label: block.label, value: displayValue(block, values[block.id]) });
          break;
        case 'heading':
          rows.push({ heading: block.text });
          break;
        case 'yesno':
          rows.push({ label: block.label, value: values[block.id] });
          break;
        case 'verursacher': {
          rows.push({ label: block.label, value: values[block.id] });
          const chosen = block.options.find((o) => o.value === values[block.id]);
          for (const f of chosen?.fields ?? []) rows.push({ label: f.label, value: values[f.id] });
          break;
        }
        case 'repeat': {
          const count = Math.max(...block.fields.map((f) => values[f.id].length), 1);
          for (let i = 0; i < count; i++) {
            if (i > 0) rows.push({ heading: `${block.addLabel} (${i + 1})` });
            for (const f of block.fields) rows.push({ label: f.label, value: values[f.id][i] ?? '' });
          }
          break;
        }
        case 'matrix':
        case 'checkboxes':
          rows.push({ label: block.label, value: values[block.id].join(', ') });
          break;
        case 'file':
          rows.push({ label: block.label, value: uploads[block.id].map((f) => f.name).join(', ') });
          break;
        case 'filerepeat':
          rows.push({ label: block.addLabel, value: uploads[block.id].map((f) => f.name).join(', ') });
          break;
      }
    }
    out.push({ heading: section.heading ?? null, rows });
  }
  return out;
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function renderText(sections) {
  const lines = [TITLE, ''];
  for (const s of sections) {
    if (s.heading) lines.push(`== ${s.heading} ==`);
    for (const r of s.rows) {
      if (r.heading) lines.push(`-- ${r.heading} --`);
      else lines.push(`${r.label} ${r.value || '–'}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

export function renderHtml(sections) {
  const parts = [`<h1 style="font-family:sans-serif">${escapeHtml(TITLE)}</h1>`];
  for (const s of sections) {
    if (s.heading) parts.push(`<h2 style="font-family:sans-serif;font-size:16px;margin:18px 0 6px">${escapeHtml(s.heading)}</h2>`);
    parts.push('<table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">');
    for (const r of s.rows) {
      if (r.heading) {
        parts.push(`<tr><td colspan="2" style="padding:6px 0 2px;font-weight:bold">${escapeHtml(r.heading)}</td></tr>`);
      } else {
        const v = r.value ? escapeHtml(r.value).replace(/\n/g, '<br>') : '–';
        parts.push(
          `<tr><td style="padding:2px 12px 2px 0;vertical-align:top;color:#555">${escapeHtml(r.label)}</td><td style="padding:2px 0">${v}</td></tr>`,
        );
      }
    }
    parts.push('</table>');
  }
  return parts.join('\n');
}

export function mainSubject(values) {
  return [TITLE, values.erfassungsdatum, values.verfasser].filter(Boolean).join(' – ');
}

// Nachricht bei «Fehlerhafte Pläne» (Zelle D119). Inhalt: Hinweis der Vorlage plus Angaben zur Zuordnung.
export function plansMessage(values) {
  const ident = [
    ['Baustellennummer:', values.baustellennummer],
    ['Adresse: (Strasse & Nr.)', values.baustelle_adresse],
    ['Datum / Uhrzeit:', formatDateTime(values.datum_uhrzeit)],
    ['Bauführer / Disponent', values.bauf_disponent],
    ['Verfasser:', values.verfasser],
  ];
  const subject = `${TITLE} – Fehlerhafte Pläne`;
  const intro = 'Pläne an schaden@tozzo.ch zuzustellen';
  const text = [intro, '', ...ident.map(([l, v]) => `${l} ${v || '–'}`)].join('\n');
  const html = [
    `<p style="font-family:sans-serif"><strong>${escapeHtml(intro)}</strong></p>`,
    '<table style="font-family:sans-serif;font-size:14px">',
    ...ident.map(([l, v]) => `<tr><td style="padding-right:12px;color:#555">${escapeHtml(l)}</td><td>${escapeHtml(v) || '–'}</td></tr>`),
    '</table>',
  ].join('\n');
  return { subject, text, html, note: PLANS_NOTE };
}

export function safeFilename(name, index) {
  const ext = fileExtension(name);
  const base = name
    .slice(0, name.length - ext.length)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w.-]+/g, '_')
    .slice(0, 80);
  return `${String(index).padStart(2, '0')}_${base || 'datei'}${ext}`;
}
