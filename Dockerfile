FROM public.ecr.aws/docker/library/node:22-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && update-ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ARG DATABASE_URL="postgresql://dummy:dummy@localhost/dummy"
ENV DATABASE_URL=${DATABASE_URL}

ARG RUN_PRISMA_GENERATE=true

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

RUN if [ "$RUN_PRISMA_GENERATE" = "true" ]; then \
    NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma generate; \
  else \
    echo "Skipping prisma generate"; \
  fi
RUN npm run build
RUN npm prune --omit=dev \
  && npm install --no-save prisma tsx

FROM public.ecr.aws/docker/library/node:22-bookworm-slim AS runner

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && update-ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./

ENV PORT=8080

EXPOSE 8080

CMD ["node", "-e", "const { spawnSync } = require('node:child_process'); const databaseUrl = process.env.DATABASE_URL; if (databaseUrl) { try { const parsedUrl = new URL(databaseUrl); if (['localhost', '127.0.0.1', '::1'].includes(parsedUrl.hostname)) { parsedUrl.hostname = 'host.docker.internal'; process.env.DATABASE_URL = parsedUrl.toString(); } } catch { process.env.DATABASE_URL = databaseUrl.replace('@localhost:', '@host.docker.internal:').replace('@127.0.0.1:', '@host.docker.internal:').replace('@[::1]:', '@host.docker.internal:'); } } const prismaEnv = { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: '0' }; const run = (args, allowFailure = false, env = process.env) => { const result = spawnSync(process.execPath, args, { stdio: 'inherit', env }); if (result.status !== 0 && !allowFailure) { process.exit(result.status || 1); } }; run(['node_modules/prisma/build/index.js', 'migrate', 'deploy', '--schema=prisma/schema.prisma'], false, prismaEnv); run(['node_modules/tsx/dist/cli.mjs', 'prisma/seed.ts'], true, prismaEnv); require('./dist/index.js');"]
 