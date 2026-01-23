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

# ===========================================
# Stage 3: Runner (Production)
# ===========================================
FROM node:20-alpine AS runner
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

# Copy standalone output (requires output: 'standalone' in next.config.ts)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files for runtime
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# คัดลอก Prisma CLI และ Engines (ใช้วิธีเจาะจงเพื่อให้รัน npx prisma ได้)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin ./node_modules/.bin

# คัดลอก engines และ client จาก .pnpm (สำหรับ pnpm)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.pnpm ./node_modules/.pnpm

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set hostname
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
# Start the application
CMD ["node", "server.js"]
