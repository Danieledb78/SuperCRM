# Web Dockerfile
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
COPY packages/web/package.json ./packages/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# ============================================
# Builder stage
# ============================================
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/web/node_modules ./packages/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy source files
COPY packages/web ./packages/web
COPY packages/shared ./packages/shared
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./

# Build shared package
RUN cd packages/shared && pnpm build

# Set environment variables for build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:3001}

# Build Next.js app
RUN cd packages/web && pnpm build

# ============================================
# Production stage
# ============================================
FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built files
COPY --from=builder /app/packages/web/public ./packages/web/public
COPY --from=builder /app/packages/web/.next/standalone ./
COPY --from=builder /app/packages/web/.next/static ./packages/web/.next/static

USER nextjs

WORKDIR /app/packages/web

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
