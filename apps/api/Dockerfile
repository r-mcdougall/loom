# syntax=docker/dockerfile:1
#
# Multi-stage build for @loom/api.
# Build context MUST be the repository root (workspace packages live in packages/):
#   docker build -f apps/api/Dockerfile -t loom-api .

FROM docker.io/oven/bun:1-alpine AS base
WORKDIR /app

# ---------------------------------------------------------------------------
# Stage 1 — install: production dependencies only.
# ---------------------------------------------------------------------------
FROM base AS install
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/types/package.json packages/types/package.json
RUN bun install --production --frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 2 — build: compile the entrypoint into one minified bundle.
# ---------------------------------------------------------------------------
FROM base AS build
# Bun doesn't fully hoist deps to the root node_modules for workspaces — it
# also links straight into each workspace's own node_modules (e.g.
# apps/api/node_modules/hono, packages/types/node_modules/zod). Copy the
# whole install-stage /app so those nested node_modules come along, then
# overlay the real source on top (COPY merges into existing dirs, it doesn't
# wipe them, so the linked deps survive).
COPY --from=install /app ./
COPY packages/types packages/types
COPY apps/api apps/api
RUN bun build apps/api/src/index.ts \
      --target=bun \
      --minify \
      --outfile apps/api/dist/index.js

# ---------------------------------------------------------------------------
# Stage 3 — release: minimal, non-root runtime.
# ---------------------------------------------------------------------------
FROM base AS release
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=/app/data/loom.db

COPY --from=build /app/apps/api/dist/index.js ./index.js

RUN mkdir -p /app/data && chown -R bun:bun /app

USER bun
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["bun", "run", "index.js"]
