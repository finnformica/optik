CREATE VIEW "public"."view_profit_distribution" WITH (security_invoker = true) AS (
  SELECT
    a.account_key,
    s.underlying_symbol,
    SUM(ft.net_amount) as total_profit,
    COUNT(*)::integer as trade_count
  FROM "fact_transaction" ft
  JOIN "dim_security" s ON ft.security_key = s.security_key
  JOIN "dim_account" a ON ft.account_key = a.account_key
  JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
  WHERE tt.action_category = 'TRADE'
  GROUP BY a.account_key, s.underlying_symbol
  HAVING SUM(ft.net_amount) != 0
  ORDER BY SUM(ft.net_amount) DESC
);