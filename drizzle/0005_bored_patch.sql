ALTER TABLE "tag" DROP CONSTRAINT "tag_name_unique";--> statement-breakpoint
ALTER TABLE "bookmark" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "disposable_email" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "folder" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "note" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "is_inbox" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "impersonated_by" text;--> statement-breakpoint
ALTER TABLE "tag" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_expires" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "vault_entry" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disposable_email" ADD CONSTRAINT "disposable_email_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folder" ADD CONSTRAINT "folder_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note" ADD CONSTRAINT "note_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_entry" ADD CONSTRAINT "vault_entry_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookmark_owner_id_idx" ON "bookmark" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "disposable_email_owner_id_idx" ON "disposable_email" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "folder_owner_id_idx" ON "folder" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "media_owner_id_idx" ON "media" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "note_owner_id_idx" ON "note" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "project_owner_id_idx" ON "project" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "tag_owner_id_idx" ON "tag" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "task_owner_id_idx" ON "task" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "vault_entry_owner_id_idx" ON "vault_entry" USING btree ("owner_id");--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_owner_name_unique" UNIQUE("owner_id","name");