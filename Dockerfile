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

RUN if [ "$RUN_PRISMA_GENERATE" = "true" ]; then npx prisma generate; else echo "Skipping prisma generate"; fi
RUN npm run build
RUN npm prune --omit=dev \
  && npm install --no-save prisma tsx

FROM public.ecr.aws/docker/library/node:22-bookworm-slim AS runner

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./

EXPOSE 8080

CMD ["sh", "-c", "npx prisma migrate deploy && (npx tsx prisma/seed.ts || true) && node dist/index.js"]
 