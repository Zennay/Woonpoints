# OCI multi-architecture index verified against Docker Hub and Docker manifest
# inspect on 2026-10-17; retain explicit source review for future base upgrades.
FROM node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293 AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .

FROM base AS app
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]

FROM base AS worker
CMD ["npm", "run", "worker"]
