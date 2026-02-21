# ============================================================
# LumenFin — Multi-stage Production Dockerfile
# ============================================================
# Stage 1: Install dependencies
# Stage 2: Build the Next.js application
# Stage 3: Minimal production runtime image
# ============================================================

# ── Stage 1: deps ────────────────────────────────────────────
FROM node:20-alpine AS deps

# Install libc compat for native modules (pdf-parse, canvas, etc.)
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy manifest files and install prod + dev deps (needed for build)
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: builder ──────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Bring in node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the full source
COPY . .

# Next.js collects anonymous telemetry — disable in CI/Docker
ENV NEXT_TELEMETRY_DISABLED=1

# Build the production bundle.
# Env vars that start with NEXT_PUBLIC_* must be available at
# build time so Next.js can bake them into the client bundle.
# Pass them as build-args if needed, or set them via .env.local
# before running `docker compose up --build`.
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}

RUN npm run build

# ── Stage 3: runner (production) ──────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache curl   # required for the docker-compose healthcheck

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nextjs

# Copy only the necessary artifacts from the builder stage.
# Next.js "standalone" output bundles everything needed to run
# the server without node_modules (enable it in next.config.ts
# by setting `output: 'standalone'`).
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Start the standalone Next.js server
CMD ["node", "server.js"]
