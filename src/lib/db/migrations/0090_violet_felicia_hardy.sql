DROP VIEW "public"."view_profit_distribution";--> statement-breakpoint
CREATE VIEW "public"."view_profit_distribution" WITH (security_invoker = true) AS (
  SELECT
    a.account_key,
    s.underlying_symbol,
    SUM(CASE
        -- For options: include all net amounts (premiums received/paid)
        WHEN s.security_type != 'STOCK' THEN ft.net_amount
        -- For stocks: include realized profits from sales
        WHEN s.security_type = 'STOCK' THEN COALESCE(vsp.realized_profit, 0)
        ELSE 0
    END) as total_profit,
    COUNT(CASE
        WHEN s.security_type != 'STOCK' THEN 1
        WHEN s.security_type = 'STOCK' AND vsp.realized_profit IS NOT NULL AND vsp.realized_profit != 0 THEN 1
        ELSE NULL
    END)::integer as trade_count
  FROM "fact_transaction" ft
  JOIN "dim_security" s ON ft.security_key = s.security_key
  JOIN "dim_account" a ON ft.account_key = a.account_key
  JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
  LEFT JOIN "view_stock_profit" vsp ON ft.account_key = vsp.account_key
    AND ft.transaction_key = vsp.transaction_key
  WHERE tt.action_category = 'TRADE'
  GROUP BY a.account_key, s.underlying_symbol
  HAVING SUM(CASE
      WHEN s.security_type != 'STOCK' THEN ft.net_amount
      WHEN s.security_type = 'STOCK' THEN COALESCE(vsp.realized_profit, 0)
      ELSE 0
  END) != 0
  ORDER BY SUM(CASE
      WHEN s.security_type != 'STOCK' THEN ft.net_amount
      WHEN s.security_type = 'STOCK' THEN COALESCE(vsp.realized_profit, 0)
      ELSE 0
  END) DESC
);