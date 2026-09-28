// Plattformunabhängige Logik für /api/config und /api/submit (Web-Request → Web-Response).
// Wird von der Netlify-Funktion und vom Node-Server (Docker) gleich verwendet.
import { MAX_FILE_BYTES } from '../public/js/schema.js';
import {
  parseSubmission,
  validateSubmission,
  reportRows,
  renderText,
  renderHtml,
  mainSubject,
  plansTriggered,
  plansMessage,
  safeFilename,
} from './report.js';
import { sendMail } from './mailer.js';
import { createRateLimiter } from './ratelimit.js';

const MB = 1024 * 1024;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function readConfig(env, defaults = {}) {
  const maxTotalMb = Number(env.MAX_TOTAL_UPLOAD_MB ?? defaults.maxTotalMb ?? 35);
  return {
    apiKey: env.RESEND_API_KEY ?? '',
    from: env.MAIL_FROM ?? '',
    reportTo: env.REPORT_TO ?? '',
    plansNotifyTo: env.PLANS_NOTIFY_TO ?? '',
    maxTotalBytes: Math.round(maxTotalMb * MB),
  };
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export function createHandler({ config, fetchImpl = fetch, rateLimiter = createRateLimiter(), log = console }) {
  async function handleConfig() {
    return json(200, { maxTotalBytes: config.maxTotalBytes, maxFileBytes: MAX_FILE_BYTES });
  }

  async function handleSubmit(request, { ip = 'unknown' } = {}) {
    if (request.method !== 'POST') return json(405, { error: 'Methode nicht erlaubt.' });

    const length = Number(request.headers.get('content-length') ?? 0);
    // Puffer für Textfelder und Multipart-Overhead
    if (length > config.maxTotalBytes + 1 * MB) {
      return json(413, { error: 'Die Dateien sind zusammen zu gross.' });
    }
    if (!rateLimiter(ip)) {
      return json(429, { error: 'Zu viele Meldungen in kurzer Zeit. Bitte später erneut versuchen.' });
    }

    let formData;
    try {
      formData = await request.formData();
    } catch {
      return json(400, { error: 'Ungültige Anfrage.' });
    }

    const parsed = parseSubmission(formData);
    // Honeypot ausgefüllt: für Bots wie Erfolg aussehen lassen, aber nichts versenden
    if (parsed.honeypot) return json(200, { ok: true });
    if (!UUID_RE.test(parsed.submissionId)) return json(400, { error: 'Ungültige Anfrage.' });

    const errors = await validateSubmission(parsed, { maxTotalBytes: config.maxTotalBytes });
    if (Object.keys(errors).length > 0) return json(422, { errors });

    if (!config.apiKey || !config.from || !config.reportTo || !config.plansNotifyTo) {
      log.error('Mailversand nicht konfiguriert (RESEND_API_KEY, MAIL_FROM, REPORT_TO, PLANS_NOTIFY_TO).');
      return json(500, { error: 'send_failed' });
    }

    const { values, uploads } = parsed;
    try {
      // Zuerst die Pläne-Nachricht: schlägt sie fehl, wird die Meldung nicht versendet und kann
      // wiederholt werden. Idempotency-Keys verhindern doppelte Mails bei Wiederholung.
      if (plansTriggered(values)) {
        const msg = plansMessage(values);
        await sendMail(
          {
            apiKey: config.apiKey,
            from: config.from,
            to: config.plansNotifyTo,
            subject: msg.subject,
            text: msg.text,
            html: msg.html,
            idempotencyKey: `plans-${parsed.submissionId}`,
          },
          fetchImpl,
        );
      }

      const attachments = [];
      let i = 1;
      for (const list of Object.values(uploads)) {
        for (const file of list) {
          attachments.push({
            filename: safeFilename(file.name, i++),
            content: Buffer.from(await file.arrayBuffer()).toString('base64'),
          });
        }
      }
      const sections = reportRows(values, uploads);
      await sendMail(
        {
          apiKey: config.apiKey,
          from: config.from,
          to: config.reportTo,
          subject: mainSubject(values),
          text: renderText(sections),
          html: renderHtml(sections),
          attachments,
          idempotencyKey: `report-${parsed.submissionId}`,
        },
        fetchImpl,
      );
    } catch (err) {
      log.error('Mailversand fehlgeschlagen:', err.message);
      return json(502, { error: 'send_failed' });
    }

    return json(200, { ok: true });
  }

  return { handleConfig, handleSubmit };
}
