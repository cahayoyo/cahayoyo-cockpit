# syntax=docker/dockerfile:1
# check=skip=SecretsUsedInArgOrEnv

# Build stage — full dependency tree, then the adapter's `build/` output.
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
# Placeholders only, and deliberately image ENV rather than a .env file: the
# build's worker threads do not inherit values Bun loaded from .env. The
# SvelteKit build loads server modules whose top level validates the
# environment, so build-time values must exist; every real value comes from the
# runtime environment, this stage is discarded, and nothing here ships
# (see docs/adr/0004-hosting-and-object-storage.md).
ENV DATABASE_URL=postgres://build:build@localhost:5432/build \
	BETTER_AUTH_SECRET=build-placeholder \
	VAULT_ENCRYPTION_KEY=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= \
	R2_ACCOUNT_ID=build-placeholder \
	R2_ACCESS_KEY_ID=build-placeholder \
	R2_SECRET_ACCESS_KEY=build-placeholder \
	R2_BUCKET=build-placeholder
RUN bun run build

# Runtime stage — the server output plus the sources the migration script needs
# (`bun run db:migrate` runs inside the container), production dependencies only.
FROM oven/bun:1-slim AS runtime
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production --ignore-scripts
COPY --from=build /app/build ./build
COPY --from=build /app/src ./src
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/drizzle ./drizzle
ENV NODE_ENV=production
EXPOSE 3000
USER bun
CMD ["bun", "run", "./build/index.js"]
