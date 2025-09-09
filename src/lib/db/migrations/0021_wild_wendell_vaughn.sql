DROP VIEW "public"."view_portfolio_distribution";--> statement-breakpoint
ALTER TABLE "user_access_tokens" ADD CONSTRAINT "unique_user_broker_token" UNIQUE("user_id","broker");--> statement-breakpoint
CREATE VIEW "public"."view_portfolio_distribution" AS (
  SELECT 
    user_id,
    underlying_symbol as symbol,
    SUM(position_value) as position_value,
    COUNT(*)::integer as instrument_count,
    (ABS(SUM(position_value)) / SUM(ABS(SUM(position_value))) OVER (PARTITION BY user_id)) * 100 as portfolio_percentage
    
  FROM view_positions
  WHERE position_status = 'OPEN'
  GROUP BY user_id, underlying_symbol
  ORDER BY ABS(SUM(position_value)) DESC
);