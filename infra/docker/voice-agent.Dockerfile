FROM node:24-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @property-assistant/voice-agent build
FROM node:24-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate && \
    groupadd --system app && useradd --system --gid app app
WORKDIR /app
COPY --from=build --chown=app:app /app /app
USER app
CMD ["node", "/app/apps/voice-agent/dist/livekit-worker.js", "start"]
