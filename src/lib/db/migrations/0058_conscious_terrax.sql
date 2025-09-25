ALTER TABLE "dim_user" ADD COLUMN "auth_user_id" uuid;--> statement-breakpoint
ALTER TABLE "dim_user" ADD CONSTRAINT "dim_user_auth_user_id_users_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_dim_user_auth_user_id" ON "dim_user" USING btree ("auth_user_id");--> statement-breakpoint
ALTER TABLE "dim_user" ADD CONSTRAINT "dim_user_auth_user_id_unique" UNIQUE("auth_user_id");