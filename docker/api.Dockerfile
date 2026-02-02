# API Dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# ============================================
# Dependencies stage
# ============================================
FROM base AS deps

# Copy package files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY packages/api/package.json ./packages/api/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# ============================================
# Builder stage
# ============================================
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy source files
COPY packages/api ./packages/api
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./

# Generate Prisma client
RUN cd packages/database && pnpm prisma generate

# Build shared package
RUN cd packages/shared && pnpm build

# Build API
RUN cd packages/api && pnpm build

# ============================================
# Production stage
# ============================================
FROM base AS runner

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 api

# Copy built files
COPY --from=builder /app/packages/api/dist ./packages/api/dist
COPY --from=builder /app/packages/api/package.json ./packages/api/
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R api:nodejs /app/uploads

USER api

WORKDIR /app/packages/api

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
