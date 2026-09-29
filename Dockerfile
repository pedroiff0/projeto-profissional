FROM node:22-slim AS deps
WORKDIR /app
COPY app/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund || npm install --omit=dev

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node ./app ./app
RUN mkdir -p data && chown -R node:node data

USER node
EXPOSE 5000
CMD ["node", "app/src/server.js"]
