# ========================================================
# HireLocal All-in-One (Backend API + Web Frontend)
# ========================================================
FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages ./packages

RUN npm install

COPY apps/web ./apps/web
RUN npm --prefix apps/web run build

FROM node:22-alpine AS runner

WORKDIR /app
RUN apk add --no-cache curl

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN npm install --omit=dev

COPY apps/api ./apps/api
COPY packages ./packages
COPY database ./database
COPY --from=builder /app/apps/web/dist ./apps/web/dist

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "apps/api/src/server.js"]
