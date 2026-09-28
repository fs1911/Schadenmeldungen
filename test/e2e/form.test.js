// Browser-Test (Chromium): Darstellung, Pflichtfelder, bedingte Felder, Uploads, Absenden, Bestätigung.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { createServer } from '../../server.mjs';
import { createHandler } from '../../src/handler.js';
import { mockFetch, TEST_CONFIG, PNG_BYTES } from '../helpers.js';

const CHROMIUM = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let server, browser, base, fetchImpl, pngPath;

before(async () => {
  fetchImpl = mockFetch();
  server = createServer(createHandler({ config: TEST_CONFIG, fetchImpl, log: { error: () => {} } }));
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ executablePath: CHROMIUM });
  const dir = mkdtempSync(path.join(tmpdir(), 'sm-'));
  pngPath = path.join(dir, 'foto.png');
  writeFileSync(pngPath, PNG_BYTES);
});

after(async () => {
  await browser?.close();
  server?.close();
});

async function open() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(base);
  await page.waitForSelector('#form-body section');
  return { page, errors };
}

test('Kopf, Legende, Reihenfolge der Überschriften und Kontakt', async () => {
  const { page, errors } = await open();
  assert.equal(await page.textContent('h1'), 'Schadenmeldung');
  assert.equal(await page.textContent('#logo'), 'LOGO');
  assert.equal((await page.textContent('.legend')).trim(), '* Pflichtfelder');
  const headings = await page.$$eval('#form-body h2, #form-body h3, #form-body legend.strong', (n) => n.map((x) => x.textContent));
  assert.deepEqual(headings, [
    'Schadenverursacher',
    'Geschädigter',
    'Schadenort',
    'Waren Fahrzeuge / Geräte / Maschinen beim Schadenfall dabei? Wenn ja, welche?',
    'Schadendetails',
    'Was wurde beschädigt?*',
    'Wer war dabei?',
    'Wie ist der Schaden passiert?',
    'Was ist kaputt / gestohlen?*',
    'Fotos (obligatorisch)*',
    'Warum ist der Schaden entstanden?*',
    'Wie hätte der Schaden verhindert werden können?*',
    'Autorisation des Schadenfalls*',
  ]);
  assert.equal(await page.textContent('#contact'), 'Fragen?Telefon: +41 61 935 93 93E-Mail: schaden@tozzo.ch');
  assert.equal(await page.inputValue('#f-erfassungsdatum'), new Date().toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }));
  // keine horizontale Scrollbar auf Smartphone-Breite
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  assert.deepEqual(errors, []);
  await page.close();
});

test('bedingte Felder beim Schadenverursacher', async () => {
  const { page } = await open();
  assert.equal(await page.isVisible('#f-ma_personalnummer'), false);
  await page.check('input[name="schadenverursacher"][value="Mitarbeiter"]');
  assert.ok(await page.isVisible('#f-ma_personalnummer'));
  assert.equal(await page.textContent('label[for="f-ma_personalnummer"]'), 'Personal Nummer:*');
  await page.check('input[name="schadenverursacher"][value="Externe Person"]');
  assert.equal(await page.isVisible('#f-ma_personalnummer'), false);
  assert.ok(await page.isVisible('#f-ext_name'));
  assert.ok(await page.isVisible('#f-ext_email'));
  await page.check('input[name="schadenverursacher"][value="Unwetter / höhere Gewalt"]');
  assert.ok(await page.isVisible('#f-unwetter_bemerkung'));
  await page.close();
});

test('leeres Absenden zeigt Pflichtfeldfehler und sendet nichts', async () => {
  const { page } = await open();
  const before = fetchImpl.calls.length;
  await page.click('#submit-btn');
  for (const id of ['schadenverursacher', 'beschaedigt', 'hergang_beschrieb', 'kaputt_beschrieb', 'foto', 'ursache', 'verhinderung_beschrieb', 'bauf_disponent', 'verfasser']) {
    assert.ok(await page.isVisible(`#e-${id}`), `Fehler bei ${id} fehlt`);
  }
  assert.equal(await page.textContent('#e-beschaedigt'), 'Bitte mindestens eine Auswahl treffen.');
  assert.equal(await page.isVisible('#e-erfassungsdatum'), false);
  assert.equal(fetchImpl.calls.length, before);
  await page.close();
});

test('«+» fügt weiteres Inventar und weitere Fotos hinzu', async () => {
  const { page } = await open();
  await page.click('#add-inventar');
  await page.click('#add-inventar');
  assert.equal(await page.locator('input[name="inventar_bezeichnung"]').count(), 3);
  await page.click('#add-weitere_fotos');
  assert.equal(await page.locator('input[type="file"][name="weitere_fotos"]').count(), 1);
  await page.close();
});

test('vollständige Meldung absenden → Bestätigung, Mails, danach leeres Formular', async () => {
  const { page, errors } = await open();
  fetchImpl.calls.length = 0;
  await page.fill('#f-datum_uhrzeit', '2026-09-27T14:30');
  await page.check('input[name="schadenverursacher"][value="Mitarbeiter"]');
  await page.fill('#f-ma_personalnummer', '4711');
  await page.check('input[name="geschaedigter_extern"][value="Nein"]');
  await page.fill('#f-baustellennummer', 'B-2026-17');
  await page.click('#add-inventar');
  await page.locator('input[name="inventar_bezeichnung"]').nth(0).fill('Bagger');
  await page.locator('input[name="inventar_bezeichnung"]').nth(1).fill('Lieferwagen');
  await page.check('input[name="beschaedigt"][value="Personen Intern"]');
  await page.fill('#f-hergang_beschrieb', 'Beim Rückwärtsfahren touchiert.');
  await page.fill('#f-kaputt_beschrieb', 'Stossstange von Inv. 1841 ist kaputt');
  await page.setInputFiles('#f-foto', pngPath);
  await page.click('#add-weitere_fotos');
  await page.setInputFiles('input[type="file"][name="weitere_fotos"]', pngPath);
  await page.fill('#f-schadensumme', 'ca. 2000');
  await page.check('input[name="ursache"][value="Fehlerhafte Pläne"]');
  await page.fill('#f-verhinderung_beschrieb', 'Pläne prüfen.');
  await page.fill('#f-bauf_disponent', 'Muster Hans');
  await page.fill('#f-verfasser', 'hmuster');
  await page.click('#submit-btn');

  await page.waitForSelector('#confirmation:not([hidden])');
  assert.equal(
    await page.innerText('#confirmation-text'),
    'Deine Schadenmeldung wurde erhalten!\n\nDeine Meldung wurde an die zuständige Stelle weitergeleitet und wird intern bearbeitet.\n\nMit deiner Aufmerksamkeit und deinem Handeln zeigst du, was Zero Hero bedeutet. Danke, dass du Teil davon bist!',
  );
  assert.equal(fetchImpl.calls.length, 2);
  assert.equal(fetchImpl.calls[0].body.subject, 'Schadenmeldung – Fehlerhafte Pläne');
  const report = fetchImpl.calls[1].body;
  assert.equal(report.attachments.length, 2);
  assert.match(report.text, /Datum \/ Uhrzeit: 27\.09\.2026 14:30/);
  assert.match(report.text, /Schadensumme schätzen ca\. 2000 CHF/);
  assert.match(report.text, /Inventar Bezeichnung \(Typ\): Lieferwagen/);

  // selbstlöschend: Bestätigung verschwindet, Formular ist leer
  await page.waitForSelector('#confirmation', { state: 'hidden', timeout: 12000 });
  assert.equal(await page.inputValue('#f-verfasser'), '');
  assert.equal(await page.isChecked('input[name="ursache"][value="Fehlerhafte Pläne"]'), false);
  assert.deepEqual(errors, []);
  await page.close();
});

test('Serverfehler beim Versand → Fehlermeldung statt Bestätigung', async () => {
  const { page } = await open();
  await page.route('**/api/submit', (route) => route.fulfill({ status: 502, contentType: 'application/json', body: '{"error":"send_failed"}' }));
  await page.check('input[name="schadenverursacher"][value="Unbekannt"]');
  await page.check('input[name="beschaedigt"][value="Sonstiges Extern"]');
  await page.fill('#f-hergang_beschrieb', 'x');
  await page.fill('#f-kaputt_beschrieb', 'x');
  await page.setInputFiles('#f-foto', pngPath);
  await page.check('input[name="ursache"][value="Nicht wissen"]');
  await page.fill('#f-verhinderung_beschrieb', 'x');
  await page.fill('#f-bauf_disponent', 'x');
  await page.fill('#f-verfasser', 'x');
  await page.click('#submit-btn');
  await page.waitForSelector('#form-error:not([hidden])');
  assert.equal(await page.textContent('#form-error'), 'Die Schadenmeldung konnte nicht gesendet werden. Bitte erneut versuchen.');
  assert.equal(await page.isVisible('#confirmation'), false);
  assert.equal(await page.inputValue('#f-verfasser'), 'x');
  await page.close();
});
