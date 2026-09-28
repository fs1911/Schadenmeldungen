// Netlify-Funktion (Test-Hosting). Limit für Uploads: Netlify-Funktionen akzeptieren max. ~6 MB pro Anfrage,
// daher Standard 5 MB gesamt (überschreibbar mit MAX_TOTAL_UPLOAD_MB).
import { createHandler, readConfig } from '../../src/handler.js';

const handler = createHandler({ config: readConfig(process.env, { maxTotalMb: 5 }) });

export default async (request, context) => {
  const { pathname } = new URL(request.url);
  if (pathname === '/api/config') return handler.handleConfig();
  return handler.handleSubmit(request, { ip: context.ip });
};

export const config = { path: ['/api/config', '/api/submit'] };
