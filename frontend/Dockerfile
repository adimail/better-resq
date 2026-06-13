FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY . .
ARG APP_NAME
RUN bun install --frozen-lockfile
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN bun run --cwd apps/${APP_NAME} build

FROM nginx:1.27-alpine
ARG APP_NAME
COPY --from=builder /app/apps/${APP_NAME}/dist /usr/share/nginx/html
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
    gzip on;
    gzip_static on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
