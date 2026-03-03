# syntax=docker/dockerfile:1

# ============================================
# Stage 1: Production Dependencies
# ============================================
FROM node:20-bookworm-slim AS deps

WORKDIR /app

# Copy dependency manifests for layer caching
COPY package.json package-lock.json ./

# Install production dependencies only
# Use exact versions from lockfile
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# ============================================
# Stage 2: Build Stage
# ============================================
FROM node:20-bookworm-slim AS build

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci --ignore-scripts && \
    npm cache clean --force

# Copy Prisma schema and config BEFORE source code for better caching
COPY prisma.config.ts ./
COPY prisma ./prisma

# Generate Prisma Client
# This creates src/generated/prisma/client.js and related files
RUN NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma generate

# Copy TypeScript config and source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript application
# Output goes to dist/ directory
RUN npm run build

# ============================================
# Stage 3: Runtime (Distroless)
# ============================================
FROM gcr.io/distroless/nodejs20-debian12:nonroot

WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps --chown=nonroot:nonroot /app/node_modules ./node_modules

# Copy built application from build stage
COPY --from=build --chown=nonroot:nonroot /app/dist ./dist

# Copy Prisma generated client
# Prisma generates to src/generated/prisma/ during build
COPY --from=build --chown=nonroot:nonroot /app/src/generated ./src/generated

# Copy Prisma schema and migrations for runtime (needed for migrations)
COPY --from=build --chown=nonroot:nonroot /app/prisma ./prisma

# Copy package.json for runtime metadata
COPY --chown=nonroot:nonroot package.json ./

# Set production environment
ENV NODE_ENV=production

# Expose application port (default 3000, override with PORT env var)
EXPOSE 3000

# Distroless runs as nonroot user by default (UID 65532)
# No need for USER directive

# Node-based healthcheck compatible with distroless
# Uses Node's built-in http module to check the server
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD ["/nodejs/bin/node", "-e", "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/job-roles', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"]

# Start the application
CMD ["dist/index.js"]