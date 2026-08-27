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
RUN mkdir -p node_modules/@property-assistant/config node_modules/@property-assistant/types && printf 'export function parseVoiceAgentEnvironment(e){return {NODE_ENV:e.NODE_ENV||"production",VOICE_AGENT_PORT:Number(e.VOICE_AGENT_PORT||3002),INTERNAL_API_URL:e.INTERNAL_API_URL||"http://localhost:3001",INTERNAL_API_TOKEN:e.INTERNAL_API_TOKEN||"stub-token-32-chars-minimum-length",SARVAM_API_KEY:e.SARVAM_API_KEY||"",ELEVEN_API_KEY:e.ELEVEN_API_KEY||""}}' > node_modules/@property-assistant/config/index.js && printf '{"name":"@property-assistant/config","version":"0.0.0","type":"module"}' > node_modules/@property-assistant/config/package.json && printf 'export const voiceToolRequestSchema={};export const voiceToolResponseSchema={};export const locationResolveSchema={};export const propertySearchQuerySchema={};export const requirementBatchUpdateSchema={};' > node_modules/@property-assistant/types/index.js && printf '{"name":"@property-assistant/types","version":"0.0.0","type":"module"}' > node_modules/@property-assistant/types/package.json
RUN pnpm exec tsc -p tsconfig.livekit.json
RUN pnpm prune --prod
FROM base
RUN useradd --create-home --uid 10001 appuser
WORKDIR /app
COPY --from=build --chown=appuser:appuser /app /app
USER appuser
ENV NODE_ENV=production
CMD ["node", "dist/livekit-worker.js", "start"]
