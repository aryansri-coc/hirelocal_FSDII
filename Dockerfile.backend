# ========================================================
# HireLocal Backend API & Voice CallBot Engine
# ========================================================
FROM node:22-slim AS runtime

WORKDIR /app

# Install curl
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy root manifests and workspace configs
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install production dependencies
RUN npm install --omit=dev --package-lock=false

# Copy application code, shared libraries, and database modules
COPY apps/api ./apps/api
COPY packages ./packages
COPY database ./database

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "apps/api/src/server.js"]
