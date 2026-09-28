// Versand über die Resend-API (https://resend.com/docs/api-reference/emails/send-email).
const RESEND_URL = 'https://api.resend.com/emails';

export class MailError extends Error {}

export async function sendMail({ apiKey, from, to, subject, text, html, attachments = [], idempotencyKey }, fetchImpl = fetch) {
  const res = await fetchImpl(RESEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: JSON.stringify({ from, to: splitAddresses(to), subject, text, html, attachments }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new MailError(`Resend ${res.status}: ${detail.slice(0, 500)}`);
  }
  return res.json();
}

export function splitAddresses(value) {
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
