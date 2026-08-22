# syntax=docker/dockerfile:1
ARG NODE_VERSION=24
FROM node:${NODE_VERSION}-slim AS base
ENV PNPM_HOME="/pnpm" PATH="$PNPM_HOME:$PATH"
RUN apt-get update -qq && apt-get install --no-install-recommends -y ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@10
FROM base AS build
WORKDIR /app
COPY . .
RUN node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json'));delete p.dependencies['@property-assistant/config'];delete p.dependencies['@property-assistant/types'];fs.writeFileSync('package.json',JSON.stringify(p,null,2))"
RUN pnpm install --no-frozen-lockfile
RUN pnpm exec tsc -p tsconfig.livekit.json
RUN pnpm prune --prod
FROM base
RUN useradd --create-home --uid 10001 appuser
WORKDIR /app
COPY --from=build --chown=appuser:appuser /app /app
USER appuser
ENV NODE_ENV=production
CMD ["node", "dist/livekit-worker.js", "start"]
