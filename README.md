# Schadenmeldung

Webformular gemäss `Formular_Layout_02.10.2025.xlsx` (Tabelle1). Die abgesendete Meldung wird per E-Mail
(über [Resend](https://resend.com)) inkl. Anhängen verschickt. Es werden **keine** Daten gespeichert.

- Anforderungen, 1:1-Feldliste, Entscheidungen: [`docs/Anforderungsanalyse.md`](docs/Anforderungsanalyse.md)
- Feld-Schema (einzige Quelle für Reihenfolge, Texte, Pflichtfelder): `public/js/schema.js`

## Aufbau

| Pfad | Inhalt |
|------|--------|
| `public/` | Oberfläche (HTML, CSS, JavaScript ohne Build-Schritt) |
| `src/handler.js` | `/api/config` und `/api/submit` – plattformunabhängig (Web Request/Response) |
| `src/report.js` | Prüfung der Eingaben und Aufbau der E-Mails |
| `src/mailer.js` | Versand über die Resend-API |
| `netlify/functions/api.mjs` | Netlify-Anbindung (Test) |
| `server.mjs`, `Dockerfile` | Node-Server für den späteren Betrieb auf dem Tozzo-Server |

## Konfiguration

Siehe `.env.example`. Pflicht: `RESEND_API_KEY`, `MAIL_FROM`, `REPORT_TO`, `PLANS_NOTIFY_TO`.
Fehlt eine davon, wird das Formular angezeigt, das Absenden schlägt aber mit einer Fehlermeldung fehl.

## Lokal starten

```bash
npm install          # nur für die Browser-Tests nötig
RESEND_API_KEY=... MAIL_FROM=... REPORT_TO=... PLANS_NOTIFY_TO=... npm start
# → http://localhost:3000
```

## Tests

```bash
npm test             # Schema-Abgleich mit der Vorlage + Server-Logik
npm run test:e2e     # Browser-Test (Chromium; Pfad über CHROMIUM_PATH)
```

## Netlify (Test)

1. Repository in Netlify importieren (Build-Befehl leer, Publish-Verzeichnis `public` – steht in `netlify.toml`).
2. Unter *Site configuration → Environment variables* die Variablen aus `.env.example` setzen.
3. Limit: Netlify-Funktionen nehmen max. ~6 MB pro Anfrage an → Standard 5 MB Dateien pro Meldung.

## Eigener Server (später)

```bash
docker build -t schadenmeldung .
docker run -p 3000:3000 --env-file .env schadenmeldung
```

Hinter einem Reverse-Proxy (HTTPS) `TRUST_PROXY=true` setzen. Standardlimit dort: 35 MB pro Meldung.
