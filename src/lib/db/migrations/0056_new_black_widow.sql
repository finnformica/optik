CREATE TABLE "fact_stock_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"date_key" integer NOT NULL,
	"quarter_hour" integer NOT NULL,
	"price" numeric(18, 8) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_symbol_time_cache" UNIQUE("symbol","date_key","quarter_hour")
);
--> statement-breakpoint
ALTER TABLE "fact_stock_prices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "fact_stock_prices" ADD CONSTRAINT "fact_stock_prices_date_key_dim_date_date_key_fk" FOREIGN KEY ("date_key") REFERENCES "public"."dim_date"("date_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_fact_stock_prices_symbol" ON "fact_stock_prices" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "idx_fact_stock_prices_date_time" ON "fact_stock_prices" USING btree ("date_key","quarter_hour");--> statement-breakpoint
CREATE INDEX "idx_fact_stock_prices_created_at" ON "fact_stock_prices" USING btree ("created_at");--> statement-breakpoint
CREATE POLICY "authenticated_can_read_stock_prices" ON "fact_stock_prices" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);