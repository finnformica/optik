CREATE TABLE "dim_time" (
	"time_key" serial PRIMARY KEY NOT NULL,
	"time_value" varchar(8) NOT NULL,
	"hour" integer NOT NULL,
	"minute" integer NOT NULL,
	"second" integer NOT NULL,
	"hour_minute" varchar(5) NOT NULL,
	"period_of_day" varchar(20),
	"is_market_hours" boolean DEFAULT false,
	"quarter_hour" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "dim_time_time_value_unique" UNIQUE("time_value")
);
--> statement-breakpoint
ALTER TABLE "dim_time" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "fact_transaction" ADD COLUMN "time_key" integer NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_dim_time_hour" ON "dim_time" USING btree ("hour");--> statement-breakpoint
CREATE INDEX "idx_dim_time_hour_minute" ON "dim_time" USING btree ("hour","minute");--> statement-breakpoint
CREATE INDEX "idx_dim_time_time_value" ON "dim_time" USING btree ("time_value");--> statement-breakpoint
ALTER TABLE "fact_transaction" ADD CONSTRAINT "fact_transaction_time_key_dim_time_time_key_fk" FOREIGN KEY ("time_key") REFERENCES "public"."dim_time"("time_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_fact_transaction_time" ON "fact_transaction" USING btree ("time_key");--> statement-breakpoint
CREATE INDEX "idx_fact_transaction_date_time" ON "fact_transaction" USING btree ("date_key","time_key");--> statement-breakpoint
CREATE POLICY "authenticated_can_read_times" ON "dim_time" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);