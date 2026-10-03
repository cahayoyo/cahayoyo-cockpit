DROP TABLE "bookmark_tag" CASCADE;--> statement-breakpoint
DROP TABLE "bookmark" CASCADE;--> statement-breakpoint
DELETE FROM "folder" WHERE "kind" = 'bookmark';--> statement-breakpoint
DELETE FROM "tag" WHERE "kind" = 'bookmark';--> statement-breakpoint
ALTER TABLE "folder" ALTER COLUMN "kind" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."folder_kind";--> statement-breakpoint
CREATE TYPE "public"."folder_kind" AS ENUM('note');--> statement-breakpoint
ALTER TABLE "folder" ALTER COLUMN "kind" SET DATA TYPE "public"."folder_kind" USING "kind"::"public"."folder_kind";--> statement-breakpoint
ALTER TABLE "tag" ALTER COLUMN "kind" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."tag_kind";--> statement-breakpoint
CREATE TYPE "public"."tag_kind" AS ENUM('note', 'task', 'vault');--> statement-breakpoint
ALTER TABLE "tag" ALTER COLUMN "kind" SET DATA TYPE "public"."tag_kind" USING "kind"::"public"."tag_kind";
