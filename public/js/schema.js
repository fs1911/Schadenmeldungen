// Feldliste gemäss Formular_Layout_02.10.2025.xlsx (Tabelle1), siehe docs/Anforderungsanalyse.md.
// Einzige Quelle für Reihenfolge, Bezeichnungen und Pflichtfelder – wird von Browser und Server verwendet.

export const TITLE = 'Schadenmeldung';
export const LOGO_PLACEHOLDER = 'LOGO';
export const REQUIRED_LEGEND = 'Pflichtfelder';

export const ALLOWED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
  'application/pdf': ['.pdf'],
};
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_TEXT_LENGTH = 5000;

export const CONFIRMATION_TEXT = [
  'Deine Schadenmeldung wurde erhalten!',
  'Deine Meldung wurde an die zuständige Stelle weitergeleitet und wird intern bearbeitet.',
  'Mit deiner Aufmerksamkeit und deinem Handeln zeigst du, was Zero Hero bedeutet. Danke, dass du Teil davon bist!',
];

export const PLANS_NOTE =
  'Wenn "X" - Automatische Nachricht wird an Bauführer / Disponent ausgelöst - Pläne an schaden@tozzo.ch zuzustellen';

export const CONTACT = {
  heading: 'Fragen?',
  lines: ['Telefon: +41 61 935 93 93', 'E-Mail: schaden@tozzo.ch'],
  phoneHref: 'tel:+41619359393',
  mailHref: 'mailto:schaden@tozzo.ch',
};

export const YES_NO = ['Ja', 'Nein'];

// Sternchen werden dort angezeigt, wo sie in der Vorlage stehen (Spalte A). Steht das Sternchen an einer
// Überschrift (headingRequired / heading.required), trägt das zugehörige Pflichtfeld hideStar.
//
// Blocktypen:
//   field      – einzelnes Eingabefeld (input: text | textarea | email | datetime | date-ch)
//   verursacher – Einfachauswahl mit bedingten Feldern je Option
//   yesno      – Auswahl Ja / Nein
//   file       – Upload mit Fotomöglichkeit (^)
//   repeat     – Gruppe mit «+» für weitere Einträge
//   filerepeat – «+» für weitere Upload-Felder
//   matrix     – Checkbox-Matrix (mind. 1 Auswahl)
//   checkboxes – Checkbox-Liste (mind. 1 Auswahl)
//   heading    – fette Überschrift aus der Vorlage
//   hint       – Hinweistext aus der Vorlage
export const SECTIONS = [
  {
    blocks: [
      { type: 'field', id: 'datum_uhrzeit', label: 'Datum / Uhrzeit:', input: 'datetime' },
      { type: 'field', id: 'wetter_temperatur', label: 'Wetter / Temperatur:', input: 'text' },
    ],
  },
  {
    heading: 'Schadenverursacher',
    blocks: [
      {
        type: 'verursacher',
        id: 'schadenverursacher',
        label: 'Schadenverursacher',
        required: true,
        options: [
          {
            value: 'Mitarbeiter',
            fields: [
              { id: 'ma_personalnummer', label: 'Personal Nummer:', input: 'text', required: true },
              { id: 'ma_name', label: 'Name / Vorname:', input: 'text' },
              { id: 'ma_vorgesetzter', label: 'Vorgesetzter:', input: 'text' },
            ],
          },
          {
            value: 'Externe Person',
            fields: [
              { id: 'ext_name', label: 'Name / Vorname:', input: 'text', required: true },
              { id: 'ext_adresse', label: 'Adresse:', input: 'text' },
              { id: 'ext_telefon', label: 'Telefonnummer:', input: 'tel' },
              { id: 'ext_email', label: 'Emailadresse:', input: 'email' },
            ],
          },
          {
            value: 'Unwetter / höhere Gewalt',
            fields: [{ id: 'unwetter_bemerkung', label: 'Bemerkung:', input: 'textarea' }],
          },
          {
            value: 'Unbekannt',
            fields: [{ id: 'unbekannt_bemerkung', label: 'Bemerkung:', input: 'textarea' }],
          },
        ],
      },
    ],
  },
  {
    heading: 'Geschädigter',
    blocks: [
      { type: 'yesno', id: 'geschaedigter_extern', label: 'Schaden an Eigentum von externer Person?' },
      { type: 'field', id: 'geschaedigter_name', label: 'Name / Vorname:', input: 'text' },
      { type: 'field', id: 'geschaedigter_adresse', label: 'Adresse:', input: 'text' },
      { type: 'field', id: 'geschaedigter_telefon', label: 'Telefonnummer:', input: 'tel' },
      { type: 'field', id: 'geschaedigter_email', label: 'Emailadresse:', input: 'email' },
    ],
  },
  {
    heading: 'Schadenort',
    blocks: [
      { type: 'field', id: 'baustellennummer', label: 'Baustellennummer:', input: 'text' },
      { type: 'field', id: 'baustelle_adresse', label: 'Adresse: (Strasse & Nr.)', input: 'text' },
      { type: 'field', id: 'baustelle_verantwortlicher', label: 'Verantwortlicher Baustelle / Bauführer:', input: 'text' },
    ],
  },
  {
    heading: 'Waren Fahrzeuge / Geräte / Maschinen beim Schadenfall dabei? Wenn ja, welche?',
    blocks: [
      {
        type: 'repeat',
        id: 'inventar',
        addLabel: 'Weiteres Inventar',
        fields: [
          { id: 'inventar_bezeichnung', label: 'Inventar Bezeichnung (Typ):', input: 'text' },
          { id: 'inventar_nummer', label: 'Inventar Nummer / Mietnummer:', input: 'text' },
          { id: 'inventar_kontrollschild', label: 'Kontrollschild:', input: 'text' },
        ],
      },
    ],
  },
  {
    blocks: [
      { type: 'yesno', id: 'polizeirapport_vorhanden', label: 'Polizeirapport / Anzeige vorhanden?' },
      { type: 'file', id: 'polizeirapport_datei', label: 'Polizeirapport / Anzeige hochladen:' },
      { type: 'field', id: 'polizeirapport_bemerkung', label: 'Bemerkung:', input: 'textarea' },
    ],
  },
  {
    blocks: [
      { type: 'yesno', id: 'externes_fahrzeug', label: 'Externes Fahrzeug betroffen?' },
      { type: 'file', id: 'unfallprotokoll_datei', label: 'Unfallprotokoll hochladen:' },
    ],
  },
  {
    heading: 'Schadendetails',
    blocks: [
      {
        type: 'matrix',
        id: 'beschaedigt',
        label: 'Was wurde beschädigt?',
        required: true,
        columns: ['Intern', 'Extern'],
        rows: [
          { label: 'Fahrzeuge', marks: ['', ''] },
          { label: 'Maschinen', marks: ['', ''] },
          { label: 'Personen', marks: ['*', ''] },
          { label: 'Sonstiges', marks: ['', ''] },
        ],
      },
      {
        type: 'hint',
        text: '* Bei Personenschaden an Mitarbeitern bitte Formular "Internes Unfallprotokoll" der Personalabteilung ausfüllen',
      },
      { type: 'heading', text: 'Wer war dabei?' },
      { type: 'field', id: 'dabei_bemerkung', label: 'Bemerkung:', input: 'textarea' },
      { type: 'heading', text: 'Wie ist der Schaden passiert?' },
      { type: 'field', id: 'hergang_beschrieb', label: 'Beschrieb:', input: 'textarea', required: true },
      { type: 'heading', text: 'Was ist kaputt / gestohlen?', required: true },
      {
        type: 'hint',
        text: 'Inventarnummer mit angeben z.B. "Stossstange und Scheinwerfer von Inv. 1841 ist kaputt / Lackierung von Bagger Inv. 2413 ist verkratzt"',
      },
      { type: 'field', id: 'kaputt_beschrieb', label: 'Beschrieb:', input: 'textarea', required: true, hideStar: true },
    ],
  },
  {
    heading: 'Fotos (obligatorisch)',
    headingRequired: true,
    blocks: [
      { type: 'hint', text: 'Pläne / Skizzen / Offerten / Rechnungen usw. falls vorhanden' },
      { type: 'file', id: 'foto', label: 'Foto hochladen', required: true, hideStar: true },
      { type: 'filerepeat', id: 'weitere_fotos', addLabel: 'Weitere Fotos' },
    ],
  },
  {
    blocks: [{ type: 'field', id: 'schadensumme', label: 'Schadensumme schätzen', input: 'text', suffix: 'CHF', strong: true }],
  },
  {
    blocks: [
      {
        type: 'checkboxes',
        id: 'ursache',
        label: 'Warum ist der Schaden entstanden?',
        required: true,
        options: ['Unachtsamkeit', 'Nicht wissen', 'Fehlerhafte Pläne', 'Grobfahrlässigkeit'],
      },
    ],
  },
  {
    heading: 'Wie hätte der Schaden verhindert werden können?',
    headingRequired: true,
    blocks: [{ type: 'field', id: 'verhinderung_beschrieb', label: 'Beschrieb:', input: 'textarea', required: true, hideStar: true }],
  },
  {
    heading: 'Autorisation des Schadenfalls',
    headingRequired: true,
    blocks: [{ type: 'field', id: 'bauf_disponent', label: 'Bauführer / Disponent', input: 'text', required: true, hideStar: true }],
  },
  {
    blocks: [
      { type: 'field', id: 'erfassungsdatum', label: 'Erfassungsdatum:', input: 'date-ch', required: true, placeholder: 'TT.MM.JJJJ' },
      { type: 'field', id: 'verfasser', label: 'Verfasser:', input: 'text', required: true, placeholder: 'Username' },
    ],
  },
];

export const PLANS_TRIGGER = { field: 'ursache', value: 'Fehlerhafte Pläne' };

export function matrixValue(row, column) {
  return `${row} ${column}`;
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// TT.MM.JJJJ und tatsächlich existierendes Datum
export function isValidSwissDate(value) {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
  if (!m) return false;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

export function formatSwissDate(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${date.getFullYear()}`;
}

export function fileExtension(name) {
  const i = name.lastIndexOf('.');
  return i < 0 ? '' : name.slice(i).toLowerCase();
}

export function isAllowedFile(name, mime) {
  const ext = fileExtension(name);
  const allowedExts = Object.values(ALLOWED_FILE_TYPES).flat();
  if (!allowedExts.includes(ext)) return false;
  // Manche Browser liefern für HEIC keinen oder einen generischen MIME-Typ
  if (!mime || mime === 'application/octet-stream') return true;
  return (ALLOWED_FILE_TYPES[mime] ?? []).includes(ext) || (mime.startsWith('image/hei') && ['.heic', '.heif'].includes(ext));
}

// Alle Dateifelder (für Server-Auswertung)
export function fileFieldIds() {
  const ids = [];
  for (const s of SECTIONS) for (const b of s.blocks) if (b.type === 'file' || b.type === 'filerepeat') ids.push(b.id);
  return ids;
}
