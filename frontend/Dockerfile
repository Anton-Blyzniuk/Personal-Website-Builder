# syntax=docker/dockerfile:1

# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

COPY . .

# VITE_API_BASE_URL is a build-time fallback only;
# the real value is injected at runtime via env-config.js
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ── Stage 2: Serve ───────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# gettext provides envsubst (injects $PORT into nginx config at startup)
RUN apk add --no-cache gettext

RUN rm /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html
# Stored as .template so the entrypoint can envsubst $PORT into it at runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Inline the entrypoint so there is no external file dependency
COPY <<'SCRIPT' /docker-entrypoint.sh
#!/bin/sh
set -e
PORT=${PORT:-3000}
envsubst '$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
printf 'window._env_ = {\n  API_BASE_URL: "%s"\n};\n' "${API_BASE_URL:-http://localhost:8000}" > /usr/share/nginx/html/env-config.js
exec nginx -g "daemon off;"
SCRIPT
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
