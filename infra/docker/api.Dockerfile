FROM node:22.14.0-alpine3.21 AS build
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @property-assistant/types build && \
    pnpm --filter @property-assistant/config build && \
    pnpm --filter @property-assistant/database build && \
    pnpm --filter @property-assistant/ai build
RUN node -e "const fs=require('fs'); for (const p of ['packages/types/package.json','packages/config/package.json','packages/database/package.json','packages/ai/package.json']) { const f=JSON.parse(fs.readFileSync(p)); f.exports={'.':'./dist/index.js'}; fs.writeFileSync(p, JSON.stringify(f, null, 2)); }"
RUN pnpm --filter @property-assistant/api build
FROM node:22.14.0-alpine3.21 AS runtime
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate && addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build --chown=app:app /app /app
USER app
CMD ["pnpm", "--filter", "@property-assistant/api", "start"]
