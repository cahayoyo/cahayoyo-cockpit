# Cahayoyo Cockpit

Self-hosted personal dashboard — bookmarks, notes, tasks, QA utilities, disposable-email tracking, and an encrypted vault in one place.

> Status: Phase 1 (scaffold). Modules are built incrementally; the app shell runs, but no features are live yet.

## Stack

- [SvelteKit](https://svelte.dev/docs/kit) 2 + Svelte 5 (runes) on [Bun](https://bun.sh)
- Tailwind CSS 4 + [shadcn-svelte](https://shadcn-svelte.com) + `mode-watcher` + `@lucide/svelte`
- [Drizzle ORM](https://orm.drizzle.team) + PostgreSQL (`drizzle-orm/bun-sql`)
- [Better Auth](https://www.better-auth.com) (email + password, no public signup)
- Zod 4

## Requirements

- Bun 1.4+
- PostgreSQL (local instance for development)

## Setup

```sh
bun install
cp .env.example .env   # then replace the placeholder values
```

| Variable             | Purpose                                            |
| -------------------- | -------------------------------------------------- |
| `DATABASE_URL`       | PostgreSQL connection string                       |
| `BETTER_AUTH_SECRET` | Session signing secret (`openssl rand -base64 32`) |

## Development

```sh
bun run dev     # dev server on http://localhost:5173
bun run check   # svelte-check (types)
bun run lint    # prettier + eslint
bun test        # unit tests (bun:test)
bun run build   # production build (svelte-adapter-bun)
```

## Database

Drizzle schema lives in `src/lib/server/db/schema.ts` (populated in Phase 2).

```sh
bun run db:generate   # generate a migration from the schema
bun run db:migrate    # apply migrations
```

## Deployment

Docker container on a Hostinger VPS via Dokploy; PostgreSQL is Neon-managed and media lives in a private Cloudflare R2 bucket. Production deploys from `main` only. Not provisioned yet.

Every push to `main` builds `Dockerfile` in GitHub Actions and pushes it to `ghcr.io/cahayoyo/cahayoyo-cockpit` (tags: commit sha + `latest`), then calls the Dokploy deploy webhook. Repository secret:

| Secret                   | Purpose                                                     |
| ------------------------ | ----------------------------------------------------------- |
| `DOKPLOY_DEPLOY_WEBHOOK` | Dokploy deploy webhook URL; the step is skipped while unset |

The registry package is private by default: Dokploy pulls it with a credential that has `read:packages` (classic PAT or fine-grained token). Migrations run in-container with `bun run db:migrate` — the runtime image carries `src/`, `scripts/`, and `drizzle/` for it.
