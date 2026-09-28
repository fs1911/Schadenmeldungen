import { randomUUID } from 'node:crypto';

// 1x1 PNG
export const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
export const PDF_BYTES = Buffer.from('%PDF-1.4\n%test\n');

export function pngFile(name = 'foto.png', bytes = PNG_BYTES) {
  return new File([bytes], name, { type: 'image/png' });
}

// Minimal gültige Meldung (nur Pflichtfelder)
export function validFormData(overrides = {}) {
  const fd = new FormData();
  const base = {
    submission_id: randomUUID(),
    schadenverursacher: 'Mitarbeiter',
    ma_personalnummer: '4711',
    beschaedigt: ['Fahrzeuge Intern'],
    hergang_beschrieb: 'Beim Rückwärtsfahren touchiert.',
    kaputt_beschrieb: 'Stossstange von Inv. 1841 ist kaputt',
    ursache: ['Unachtsamkeit'],
    verhinderung_beschrieb: 'Einweiser einsetzen.',
    bauf_disponent: 'Muster Hans',
    erfassungsdatum: '28.09.2026',
    verfasser: 'hmuster',
    ...overrides,
  };
  for (const [k, v] of Object.entries(base)) {
    if (v === undefined) continue;
    for (const item of Array.isArray(v) ? v : [v]) fd.append(k, item);
  }
  if (!('foto' in overrides)) fd.append('foto', pngFile());
  return fd;
}

export function mockFetch(status = 200) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body), headers: init.headers });
    return new Response(JSON.stringify({ id: `mail-${calls.length}` }), { status });
  };
  fn.calls = calls;
  return fn;
}

export const TEST_CONFIG = {
  apiKey: 're_test',
  from: 'Schadenmeldung <meldung@example.ch>',
  reportTo: 'filip.subara@tozzo.ch',
  plansNotifyTo: 'filip.subara@tozzo.ch',
  maxTotalBytes: 5 * 1024 * 1024,
};
