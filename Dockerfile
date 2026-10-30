# OCI multi-architecture index verified against Docker Hub and Docker manifest
# inspect on 2026-10-17; retain explicit source review for future base upgrades.
FROM node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293 AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
# A private-umask self-hosted checkout can have 0640 files / 0750 directories.
# Keep root-owned source immutable to the node runtime, but ensure node can read
# the exact allowlisted source and modules in both app and worker images.
COPY . .
RUN chmod -R a+rX /app

FROM base AS app
RUN npm run build
# Next's runtime cache must remain writable after dropping build privileges.
RUN chown -R node:node /app/.next
USER node
EXPOSE 3000
CMD ["npm", "run", "start"]

FROM base AS worker
USER node
CMD ["npm", "run", "worker"]
