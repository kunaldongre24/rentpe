FROM node:24.14.0-alpine3.21 AS build
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @property-assistant/voice-agent build
FROM node:24.14.0-alpine3.21 AS runtime
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate && addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build --chown=app:app /app /app
USER app
CMD ["pnpm", "--filter", "@property-assistant/voice-agent", "start"]
