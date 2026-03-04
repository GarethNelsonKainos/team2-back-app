FROM node:22-bookworm-slim AS builder

WORKDIR /app

ARG DATABASE_URL="postgresql://dummy:dummy@localhost/dummy"
ENV DATABASE_URL=${DATABASE_URL}

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate
RUN npm run build
RUN mkdir -p dist/generated && cp -R src/generated/prisma dist/generated/prisma
RUN npm prune --omit=dev

FROM gcr.io/distroless/nodejs22-debian12:nonroot AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["dist/index.js"]
