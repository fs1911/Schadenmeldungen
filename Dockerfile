# Betrieb auf eigenem Server (z. B. Tozzo). Keine Laufzeit-Abhängigkeiten ausser Node.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY package.json server.mjs ./
COPY src ./src
COPY public ./public
USER node
EXPOSE 3000
CMD ["node", "server.mjs"]
