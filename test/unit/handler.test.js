import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../../src/handler.js';
import { createRateLimiter } from '../../src/ratelimit.js';
import { sniffFileType, safeFilename, escapeHtml } from '../../src/report.js';
import { validFormData, mockFetch, pngFile, TEST_CONFIG, PDF_BYTES } from '../helpers.js';

function setup({ status = 200, config = {}, limit = 100 } = {}) {
  const fetchImpl = mockFetch(status);
  const log = { error: () => {} };
  const h = createHandler({ config: { ...TEST_CONFIG, ...config }, fetchImpl, rateLimiter: createRateLimiter({ limit }), log });
  const submit = (fd, ip = '1.2.3.4') => h.handleSubmit(new Request('http://x/api/submit', { method: 'POST', body: fd }), { ip });
  return { h, fetchImpl, submit };
}

test('gültige Meldung wird als E-Mail mit Anhang an REPORT_TO gesendet', async () => {
  const { fetchImpl, submit } = setup();
  const res = await submit(validFormData());
  assert.equal(res.status, 200);
  assert.equal(fetchImpl.calls.length, 1);
  const { body, headers, url } = fetchImpl.calls[0];
  assert.equal(url, 'https://api.resend.com/emails');
  assert.deepEqual(body.to, ['filip.subara@tozzo.ch']);
  assert.equal(body.subject, 'Schadenmeldung – 28.09.2026 – hmuster');
  assert.equal(body.attachments.length, 1);
  assert.equal(body.attachments[0].filename, '01_foto.png');
  assert.match(headers['Idempotency-Key'], /^report-/);
  assert.match(body.text, /Personal Nummer: 4711/);
  assert.match(body.text, /Was wurde beschädigt\? Fahrzeuge Intern/);
});

test('Felder nicht gewählter Verursacher-Optionen erscheinen nicht in der E-Mail', async () => {
  const { fetchImpl, submit } = setup();
  await submit(validFormData({ schadenverursacher: 'Unbekannt', unbekannt_bemerkung: 'Nachts passiert' }));
  const text = fetchImpl.calls[0].body.text;
  assert.match(text, /Schadenverursacher Unbekannt\nBemerkung: Nachts passiert/);
  assert.doesNotMatch(text, /Personal Nummer/);
});

test('Reihenfolge in der E-Mail entspricht der Vorlage', async () => {
  const { fetchImpl, submit } = setup();
  await submit(validFormData());
  const text = fetchImpl.calls[0].body.text;
  const order = ['Datum / Uhrzeit:', 'Schadenverursacher', 'Geschädigter', 'Schadenort', 'Inventar Bezeichnung', 'Polizeirapport', 'Unfallprotokoll', 'Was wurde beschädigt?', 'Wer war dabei?', 'Foto hochladen', 'Schadensumme', 'Warum ist', 'Wie hätte', 'Autorisation', 'Erfassungsdatum:', 'Verfasser:'];
  let pos = -1;
  for (const o of order) {
    const i = text.indexOf(o, pos + 1);
    assert.ok(i > pos, `${o} an falscher Stelle`);
    pos = i;
  }
});

test('«Fehlerhafte Pläne» löst zusätzliche Nachricht an Bauführer/Disponent aus', async () => {
  const { fetchImpl, submit } = setup({ config: { plansNotifyTo: 'bf@example.ch' } });
  const res = await submit(validFormData({ ursache: ['Unachtsamkeit', 'Fehlerhafte Pläne'], baustellennummer: 'B-123' }));
  assert.equal(res.status, 200);
  assert.equal(fetchImpl.calls.length, 2);
  const plans = fetchImpl.calls[0].body;
  assert.deepEqual(plans.to, ['bf@example.ch']);
  assert.equal(plans.subject, 'Schadenmeldung – Fehlerhafte Pläne');
  assert.match(plans.text, /Pläne an schaden@tozzo.ch zuzustellen/);
  assert.match(plans.text, /Baustellennummer: B-123/);
  assert.match(fetchImpl.calls[0].headers['Idempotency-Key'], /^plans-/);
});

test('ohne «Fehlerhafte Pläne» keine zusätzliche Nachricht', async () => {
  const { fetchImpl, submit } = setup();
  await submit(validFormData({ ursache: ['Grobfahrlässigkeit'] }));
  assert.equal(fetchImpl.calls.length, 1);
});

test('Pflichtfelder fehlen → 422 mit Feldfehlern, kein Versand', async () => {
  const { fetchImpl, submit } = setup();
  const fd = new FormData();
  fd.append('submission_id', crypto.randomUUID());
  const res = await submit(fd);
  assert.equal(res.status, 422);
  const { errors } = await res.json();
  assert.deepEqual(Object.keys(errors).sort(), [
    'bauf_disponent',
    'beschaedigt',
    'erfassungsdatum',
    'foto',
    'hergang_beschrieb',
    'kaputt_beschrieb',
    'schadenverursacher',
    'ursache',
    'verfasser',
    'verhinderung_beschrieb',
  ]);
  assert.equal(errors.beschaedigt, 'Bitte mindestens eine Auswahl treffen.');
  assert.equal(fetchImpl.calls.length, 0);
});

test('bedingte Pflichtfelder: Personal Nummer bei Mitarbeiter, Name bei Externe Person', async () => {
  const { submit } = setup();
  let res = await submit(validFormData({ ma_personalnummer: '' }));
  assert.deepEqual(Object.keys((await res.json()).errors), ['ma_personalnummer']);
  res = await submit(validFormData({ schadenverursacher: 'Externe Person', ma_personalnummer: '' }));
  assert.deepEqual(Object.keys((await res.json()).errors), ['ext_name']);
  res = await submit(validFormData({ schadenverursacher: 'Unbekannt', ma_personalnummer: '' }));
  assert.equal(res.status, 200);
});

test('ungültige Werte werden abgelehnt', async () => {
  const { submit } = setup();
  const res = await submit(
    validFormData({
      schadenverursacher: 'Externe Person',
      ext_name: 'X',
      ext_email: 'kein-mail',
      geschaedigter_extern: 'Vielleicht',
      beschaedigt: ['Fahrzeuge Intern', 'Häuser Extern'],
      ursache: ['Pech'],
      erfassungsdatum: '31.02.2026',
      datum_uhrzeit: 'gestern',
    }),
  );
  const { errors } = await res.json();
  assert.deepEqual(Object.keys(errors).sort(), ['beschaedigt', 'datum_uhrzeit', 'erfassungsdatum', 'ext_email', 'geschaedigter_extern', 'ursache']);
});

test('Dateien: falscher Inhalt, falscher Typ, zu gross', async () => {
  const { submit } = setup({ config: { maxTotalBytes: 1024 } });
  let res = await submit(validFormData({ foto: new File(['nicht wirklich png'], 'x.png', { type: 'image/png' }) }));
  assert.equal((await res.json()).errors.foto, 'Dateiinhalt passt nicht zum Dateityp.');
  res = await submit(validFormData({ foto: new File(['MZ'], 'x.exe', { type: 'application/octet-stream' }) }));
  assert.equal((await res.json()).errors.foto, 'Erlaubt sind JPG, PNG, HEIC und PDF.');
  const big = Buffer.concat([Buffer.from(PDF_BYTES), Buffer.alloc(2048)]);
  res = await submit(validFormData({ polizeirapport_datei: new File([big], 'r.pdf', { type: 'application/pdf' }) }));
  assert.match((await res.json()).errors._form, /zu gross/);
});

test('weitere Fotos und Inventar werden übernommen', async () => {
  const { fetchImpl, submit } = setup();
  const res = await submit(
    validFormData({
      weitere_fotos: [pngFile('a.png'), pngFile('b.png')],
      inventar_bezeichnung: ['Bagger', 'Lieferwagen'],
      inventar_nummer: ['2413', '1841'],
      inventar_kontrollschild: ['', 'BL 12345'],
    }),
  );
  assert.equal(res.status, 200);
  const body = fetchImpl.calls[0].body;
  assert.equal(body.attachments.length, 3);
  assert.match(body.text, /-- Weiteres Inventar \(2\) --\nInventar Bezeichnung \(Typ\): Lieferwagen/);
  assert.match(body.text, /Kontrollschild: BL 12345/);
});

test('Honeypot ausgefüllt → Erfolg vortäuschen, nichts senden', async () => {
  const { fetchImpl, submit } = setup();
  const res = await submit(validFormData({ website: 'http://spam' }));
  assert.equal(res.status, 200);
  assert.equal(fetchImpl.calls.length, 0);
});

test('Begrenzung pro IP', async () => {
  const { submit } = setup({ limit: 2 });
  assert.equal((await submit(validFormData())).status, 200);
  assert.equal((await submit(validFormData())).status, 200);
  assert.equal((await submit(validFormData())).status, 429);
  assert.equal((await submit(validFormData(), '5.6.7.8')).status, 200);
});

test('fehlende Konfiguration oder Resend-Fehler → Fehler, keine Bestätigung', async () => {
  let { submit } = setup({ config: { apiKey: '' } });
  assert.equal((await submit(validFormData())).status, 500);
  ({ submit } = setup({ status: 422 }));
  assert.equal((await submit(validFormData())).status, 502);
});

test('fehlende submission_id → 400', async () => {
  const { submit } = setup();
  assert.equal((await submit(validFormData({ submission_id: 'abc' }))).status, 400);
});

test('HTML in Eingaben wird in der E-Mail maskiert', async () => {
  const { fetchImpl, submit } = setup();
  await submit(validFormData({ hergang_beschrieb: '<script>alert(1)</script>' }));
  assert.doesNotMatch(fetchImpl.calls[0].body.html, /<script>/);
  assert.equal(escapeHtml('<a href="x">'), '&lt;a href=&quot;x&quot;&gt;');
});

test('Hilfsfunktionen', () => {
  assert.equal(sniffFileType(Buffer.from([0xff, 0xd8, 0xff, 0xe0])), 'jpeg');
  assert.equal(sniffFileType(Buffer.from('\0\0\0\x18ftypheic', 'latin1')), 'heic');
  assert.equal(safeFilename('../../etc/passwd.pdf', 3), '03_.._.._etc_passwd.pdf');
  assert.equal(safeFilename('Schäden Foto.JPG', 1), '01_Schaden_Foto.jpg');
});

test('/api/config liefert Limits', async () => {
  const { h } = setup();
  const res = await h.handleConfig();
  assert.deepEqual(await res.json(), { maxTotalBytes: 5 * 1024 * 1024, maxFileBytes: 10 * 1024 * 1024 });
});
