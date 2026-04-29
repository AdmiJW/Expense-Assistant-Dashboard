# ============================================================
# Stage 1 – deps
# Install ALL npm dependencies (incl. devDeps for the build).
# python3 / make / g++ are required so that better-sqlite3 can
# compile its native Node.js addon via node-gyp.
# ============================================================
FROM node:20-alpine AS deps

RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci


# ============================================================
# Stage 2 – builder
# Compile the Next.js application.
# Reuses the pre-compiled node_modules from the deps stage so
# the native better-sqlite3 binary is already available.
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build


# ============================================================
# Stage 3 – runner
# Minimal production image.
# Only the standalone output is copied — no node_modules root,
# no source files, no devDependencies.
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Least-privilege user
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Static assets served directly by the Next.js standalone server
COPY --from=builder /app/public                  ./public
COPY --from=builder --chown=nextjs:nodejs \
     /app/.next/standalone                       ./
COPY --from=builder --chown=nextjs:nodejs \
     /app/.next/static                           ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Required at runtime — set these via -e flags or docker-compose:
#   EXPENSE_DB_PATH       absolute path inside the container
#   AUTH_DB_PATH          absolute path inside the container
#   ATTACHMENTS_DIR_PATH  absolute path inside the container
#   NEXTAUTH_SECRET       random secret (openssl rand -base64 32)
#   NEXT_PUBLIC_DISPLAY_TIMEZONE  e.g. Asia/Kuala_Lumpur

CMD ["node", "server.js"]
