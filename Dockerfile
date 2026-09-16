FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

FROM base AS app
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM base AS worker
CMD ["npm", "run", "worker"]
