# ===========================================
# CRM-Bank Production Dockerfile
# Multi-stage build for optimal image size
# ===========================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# ===========================================
# Stage 2: Builder
# ===========================================
FROM node:20-alpine AS builder
WORKDIR /app

# Dummy DATABASE_URL สำหรับช่วง build (prisma generate / next build ต้องการค่านี้)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN pnpm prisma generate

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm build

# Resolve pnpm symlinks for Prisma packages so Docker COPY gets real files
RUN mkdir -p /app/prisma-resolved && \
    cp -rL /app/node_modules/.prisma /app/prisma-resolved/.prisma && \
    cp -rL /app/node_modules/@prisma /app/prisma-resolved/@prisma && \
    cp -rL /app/node_modules/prisma /app/prisma-resolved/prisma

# ===========================================
# Stage 3: Runner (Production)
# ===========================================
FROM node:20-alpine AS runner
# Add dependencies for Prisma and other native modules
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Set correct permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone output (includes traced node_modules with Prisma runtime deps)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and config for migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# Copy resolved (de-symlinked) Prisma packages for CLI and runtime
COPY --from=builder --chown=nextjs:nodejs /app/prisma-resolved/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma-resolved/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma-resolved/prisma ./node_modules/prisma

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set hostname
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Health check
# Start the application
CMD ["node", "server.js"]
