// QA-Abgleich: Schema gegen Tabelle1 der Excel-Vorlage (inkl. freigegebener Entscheidungen, docs/Anforderungsanalyse.md Teil D).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECTIONS, TITLE, LOGO_PLACEHOLDER, CONFIRMATION_TEXT, CONTACT, isValidSwissDate, isAllowedFile } from '../../public/js/schema.js';

// Erwartete Reihenfolge aller sichtbaren Texte. '*' = Sternchen gemäss Spalte A.
const EXPECTED = [
  'Datum / Uhrzeit:',
  'Wetter / Temperatur:',
  'H:Schadenverursacher',
  'V*:Mitarbeiter|Externe Person|Unwetter / höhere Gewalt|Unbekannt',
  '  Mitarbeiter: Personal Nummer:*',
  '  Mitarbeiter: Name / Vorname:',
  '  Mitarbeiter: Vorgesetzter:',
  '  Externe Person: Name / Vorname:*',
  '  Externe Person: Adresse:',
  '  Externe Person: Telefonnummer:',
  '  Externe Person: Emailadresse:',
  '  Unwetter / höhere Gewalt: Bemerkung:',
  '  Unbekannt: Bemerkung:',
  'H:Geschädigter',
  'YN:Schaden an Eigentum von externer Person?',
  'Name / Vorname:',
  'Adresse:',
  'Telefonnummer:',
  'Emailadresse:',
  'H:Schadenort',
  'Baustellennummer:',
  'Adresse: (Strasse & Nr.)',
  'Verantwortlicher Baustelle / Bauführer:',
  'H:Waren Fahrzeuge / Geräte / Maschinen beim Schadenfall dabei? Wenn ja, welche?',
  'Inventar Bezeichnung (Typ):',
  'Inventar Nummer / Mietnummer:',
  'Kontrollschild:',
  '+:Weiteres Inventar',
  'YN:Polizeirapport / Anzeige vorhanden?',
  '^:Polizeirapport / Anzeige hochladen:',
  'Bemerkung:',
  'YN:Externes Fahrzeug betroffen?',
  '^:Unfallprotokoll hochladen:',
  'H:Schadendetails',
  'M*:Was wurde beschädigt?|Intern,Extern|Fahrzeuge,Maschinen,Personen[Intern*],Sonstiges',
  'I:* Bei Personenschaden an Mitarbeitern bitte Formular "Internes Unfallprotokoll" der Personalabteilung ausfüllen',
  'SH:Wer war dabei?',
  'Bemerkung:',
  'SH:Wie ist der Schaden passiert?',
  'Beschrieb:*',
  'SH*:Was ist kaputt / gestohlen?',
  'I:Inventarnummer mit angeben z.B. "Stossstange und Scheinwerfer von Inv. 1841 ist kaputt / Lackierung von Bagger Inv. 2413 ist verkratzt"',
  'Beschrieb:',
  'H*:Fotos (obligatorisch)',
  'I:Pläne / Skizzen / Offerten / Rechnungen usw. falls vorhanden',
  '^:Foto hochladen',
  '+:Weitere Fotos',
  'Schadensumme schätzen [CHF]',
  'C*:Warum ist der Schaden entstanden?|Unachtsamkeit,Nicht wissen,Fehlerhafte Pläne,Grobfahrlässigkeit',
  'H*:Wie hätte der Schaden verhindert werden können?',
  'Beschrieb:',
  'H*:Autorisation des Schadenfalls',
  'Bauführer / Disponent',
  'Erfassungsdatum:*',
  'Verfasser:*',
];

function st(x) {
  return x.required && !x.hideStar ? '*' : '';
}

function flatten() {
  const out = [];
  for (const s of SECTIONS) {
    if (s.heading) out.push(`H${s.headingRequired ? '*' : ''}:${s.heading}`);
    for (const b of s.blocks) {
      switch (b.type) {
        case 'field':
          out.push(`${b.label}${st(b)}${b.suffix ? ` [${b.suffix}]` : ''}`);
          break;
        case 'verursacher':
          out.push(`V${st(b)}:${b.options.map((o) => o.value).join('|')}`);
          for (const o of b.options) for (const f of o.fields) out.push(`  ${o.value}: ${f.label}${st(f)}`);
          break;
        case 'yesno':
          out.push(`YN:${b.label}`);
          break;
        case 'file':
          out.push(`^:${b.label}${st(b)}`);
          break;
        case 'repeat':
          for (const f of b.fields) out.push(`${f.label}${st(f)}`);
          out.push(`+:${b.addLabel}`);
          break;
        case 'filerepeat':
          out.push(`+:${b.addLabel}`);
          break;
        case 'matrix':
          out.push(
            `M${st(b)}:${b.label}|${b.columns.join(',')}|${b.rows
              .map((r) => r.label + (r.marks.some(Boolean) ? `[${b.columns.filter((_, i) => r.marks[i]).map((c, i) => c + r.marks.filter(Boolean)[i]).join(',')}]` : ''))
              .join(',')}`,
          );
          break;
        case 'checkboxes':
          out.push(`C${st(b)}:${b.label}|${b.options.join(',')}`);
          break;
        case 'heading':
          out.push(`SH${b.required ? '*' : ''}:${b.text}`);
          break;
        case 'hint':
          out.push(`I:${b.text}`);
          break;
      }
    }
  }
  return out;
}

test('Reihenfolge, Wortlaut, Auswahlmöglichkeiten und Sternchen entsprechen Tabelle1', () => {
  assert.deepEqual(flatten(), EXPECTED);
});

test('Titel und Logo-Platzhalter', () => {
  assert.equal(TITLE, 'Schadenmeldung');
  assert.equal(LOGO_PLACEHOLDER, 'LOGO');
});

test('Bestätigungstext wortgetreu (Zelle B148)', () => {
  assert.equal(
    CONFIRMATION_TEXT.join('\n\n') + '\n',
    'Deine Schadenmeldung wurde erhalten!\n\nDeine Meldung wurde an die zuständige Stelle weitergeleitet und wird intern bearbeitet.\n\nMit deiner Aufmerksamkeit und deinem Handeln zeigst du, was Zero Hero bedeutet. Danke, dass du Teil davon bist!\n',
  );
});

test('Kontaktangaben (B139–B141)', () => {
  assert.equal(CONTACT.heading, 'Fragen?');
  assert.deepEqual(CONTACT.lines, ['Telefon: +41 61 935 93 93', 'E-Mail: schaden@tozzo.ch']);
});

test('Pflichtfelder ohne Sternchen am Feld haben das Sternchen an der Überschrift', () => {
  const hidden = [];
  for (const s of SECTIONS) for (const b of s.blocks) if (b.hideStar) hidden.push(b.id);
  assert.deepEqual(hidden, ['kaputt_beschrieb', 'foto', 'verhinderung_beschrieb', 'bauf_disponent']);
});

test('Datumsprüfung TT.MM.JJJJ', () => {
  assert.ok(isValidSwissDate('28.09.2026'));
  assert.ok(isValidSwissDate('29.02.2024'));
  assert.ok(!isValidSwissDate('29.02.2025'));
  assert.ok(!isValidSwissDate('2026-09-28'));
  assert.ok(!isValidSwissDate('1.9.2026'));
});

test('Dateitypen', () => {
  assert.ok(isAllowedFile('a.JPG', 'image/jpeg'));
  assert.ok(isAllowedFile('a.pdf', 'application/pdf'));
  assert.ok(isAllowedFile('a.heic', ''));
  assert.ok(!isAllowedFile('a.exe', 'application/octet-stream'));
  assert.ok(!isAllowedFile('a.pdf', 'image/png'));
});
