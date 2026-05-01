#!/bin/sh
set -e

PORT=${PORT:-3000}

# Process nginx config template — only substitute $PORT, leave nginx $variables alone
envsubst '$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Write runtime environment config
cat > /usr/share/nginx/html/env-config.js << EOF
window._env_ = {
  API_BASE_URL: "${API_BASE_URL:-http://localhost:8000}"
};
EOF

echo "Starting nginx on port $PORT, API_BASE_URL=${API_BASE_URL:-http://localhost:8000}"

exec nginx -g "daemon off;"
