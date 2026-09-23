# Cahayoyo Cockpit

Self-hosted personal dashboard — bookmarks, notes, tasks, QA utilities, disposable-email tracking, and an encrypted vault in one place.

> Status: v1.0.0 shipped and live at [cockpit.cahayoyo.tech](https://cockpit.cahayoyo.tech) — Docker on a VPS via Dokploy. `main` is production; `development` is the integration branch.

## Stack

- [SvelteKit](https://svelte.dev/docs/kit) 2 + Svelte 5 (runes) on [Bun](https://bun.sh)
- Tailwind CSS 4 + [shadcn-svelte](https://shadcn-svelte.com) + `mode-watcher` + `@lucide/svelte`
- [Drizzle ORM](https://orm.drizzle.team) + PostgreSQL (Neon; driver `drizzle-orm/bun-sql`)
- [Better Auth](https://www.better-auth.com) (email + password, no public signup)
- Zod 4
- Media in a private Cloudflare R2 bucket, served through the authenticated `/media/<id>` proxy

## Requirements

- Bun 1.4+
- A PostgreSQL database (Neon-managed in dev and production)

## Setup

```sh
bun install
cp .env.example .env   # then replace the placeholder values
```

| Variable                                                                 | Purpose                                                                                 |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                           | PostgreSQL connection string (Neon; pooled for the app, direct for migrations)          |
| `BETTER_AUTH_SECRET`                                                     | Session signing secret (`openssl rand -base64 32`)                                      |
| `VAULT_ENCRYPTION_KEY`                                                   | Vault AES-256-GCM key, base64 for exactly 32 bytes — never change it once entries exist |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Private Cloudflare R2 bucket for media                                                  |
| `SEED_ADMIN_*`, `SEED_TEST_*`                                            | Dev-only seed accounts (`bun run db:seed`) — never set in production                    |

## Development

```sh
bun run dev     # dev server on http://localhost:5173
bun run check   # svelte-check (types)
bun run lint    # prettier + eslint
bun test        # unit tests (bun:test)
bun run build   # production build (svelte-adapter-bun)
```

## Database

The Drizzle schema in `src/lib/server/db/schema.ts` is the source of truth for the data model.

```sh
bun run db:generate   # generate a migration from the schema
bun run db:migrate    # apply migrations (bun scripts/migrate.ts)
bun run db:seed       # seed the dev accounts (refuses production)
```

## Deployment

Production runs from `main` as a Docker container on a Sumopod VPS (Jakarta) via Dokploy; PostgreSQL is Neon-managed and media lives in a private Cloudflare R2 bucket. `development` batches features for the next release and never deploys.

Every push to `main` builds `Dockerfile` in GitHub Actions and pushes it to `ghcr.io/cahayoyo/cahayoyo-cockpit` (tags: commit sha + `latest`), then calls the Dokploy deploy webhook. Repository secret:

| Secret                   | Purpose                                                     |
| ------------------------ | ----------------------------------------------------------- |
| `DOKPLOY_DEPLOY_WEBHOOK` | Dokploy deploy webhook URL; the step is skipped while unset |

The registry package is private by default: Dokploy pulls it with a credential that has `read:packages` (classic PAT or fine-grained token). Migrations run in-container with `bun run db:migrate` — the runtime image carries `src/`, `scripts/`, and `drizzle/` for it.
