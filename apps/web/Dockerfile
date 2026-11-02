# Multi-stage Dockerfile for HireLocal Web Frontend
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests and shared packages
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages ./packages

# Install dependencies
RUN npm install

# Copy web application source code
COPY apps/web ./apps/web

# Build production assets
RUN npm --prefix apps/web run build

# Stage 2: Production Nginx static server
FROM nginx:alpine AS runner

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
