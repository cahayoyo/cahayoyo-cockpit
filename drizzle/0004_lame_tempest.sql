ALTER TABLE "task" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "task" ALTER COLUMN "status" SET DEFAULT 'backlog'::text;--> statement-breakpoint
DROP TYPE "public"."task_status";--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('backlog', 'in_progress', 'review', 'waiting_for_acceptance', 'waiting_for_deployment', 'done');--> statement-breakpoint
ALTER TABLE "task" ALTER COLUMN "status" SET DEFAULT 'backlog'::"public"."task_status";--> statement-breakpoint
ALTER TABLE "task" ALTER COLUMN "status" SET DATA TYPE "public"."task_status" USING "status"::"public"."task_status";