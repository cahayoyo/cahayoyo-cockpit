ALTER TABLE "bookmark" ADD COLUMN "folder_id" uuid;--> statement-breakpoint
ALTER TABLE "folder" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_folder_id_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folder"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folder" ADD CONSTRAINT "folder_parent_id_folder_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."folder"("id") ON DELETE cascade ON UPDATE no action;