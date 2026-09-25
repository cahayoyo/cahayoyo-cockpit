-- Tenancy replay guard: migration 0001 seeds the legacy global Inbox without an
-- owner. On a fresh database no account exists to backfill it to (or from), so
-- the unowned seed row is removed before owner_id becomes mandatory; per-account
-- Inboxes are created when accounts are created (ADR-0005). A database that has
-- accounts keeps every row — the backfill must run first.
DELETE FROM "project"
WHERE "id" = '00000000-0000-0000-0000-000000000001'
  AND "owner_id" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "user");--> statement-breakpoint
ALTER TABLE "bookmark" ALTER COLUMN "owner_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "disposable_email" ALTER COLUMN "owner_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "folder" ALTER COLUMN "owner_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ALTER COLUMN "owner_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "note" ALTER COLUMN "owner_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "owner_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tag" ALTER COLUMN "owner_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "task" ALTER COLUMN "owner_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vault_entry" ALTER COLUMN "owner_id" SET NOT NULL;--> statement-breakpoint
DROP INDEX IF EXISTS "project_owner_inbox_unique_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "project_owner_inbox_unique_idx" ON "project" USING btree ("owner_id") WHERE "is_inbox";
