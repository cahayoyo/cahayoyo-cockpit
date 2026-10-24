DROP TABLE "note_tag" CASCADE;--> statement-breakpoint
DELETE FROM "tag" WHERE "kind" = 'note';--> statement-breakpoint
ALTER TABLE "tag" ALTER COLUMN "kind" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."tag_kind";--> statement-breakpoint
CREATE TYPE "public"."tag_kind" AS ENUM('task', 'vault');--> statement-breakpoint
ALTER TABLE "tag" ALTER COLUMN "kind" SET DATA TYPE "public"."tag_kind" USING "kind"::"public"."tag_kind";