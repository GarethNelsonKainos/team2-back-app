# Base manifest stage (stable cache key)
FROM node:20-bookworm-slim AS manifest
WORKDIR /app
COPY package.json package-lock.json ./

# Install full deps once for build
FROM manifest AS build-deps
RUN npm ci && npm cache clean --force

# Build app
FROM build-deps AS build
COPY . .
# Generate Prisma client types before compiling TypeScript.
# The CLI reads DATABASE_URL to determine the provider (postgres), but does
# not open a connection — a dummy URL is sufficient and matches what CI uses.
RUN DATABASE_URL="postgresql://david.ohanlon@localhost:5432/postgres?schema=job_roles_db" npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

# Runtime image
FROM gcr.io/distroless/nodejs20-debian12:nonroot
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["dist/index.js"]