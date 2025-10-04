CREATE OR REPLACE VIEW "public"."view_current_position" WITH (security_invoker = true) AS (
  SELECT
    vwp.account_key,
    vwp.symbol,
    vwp.security_type,
    vwp.underlying_symbol,
    vwp.quantity,
    vwp.avg_cost_per_unit,
    vwp.first_transaction_date,
    vwp.last_transaction_date,
    vwp.position_value,
    vwp.position_status,
    vwp.unrealized_pnl,
    vwp.option_type,
    vwp.expiry_date,
    vwp.strike_price
  FROM "view_weekly_position" vwp
  INNER JOIN (
    SELECT account_key, MAX(week_start) as max_week_start
    FROM "view_weekly_position"
    GROUP BY account_key
  ) latest_weeks ON vwp.account_key = latest_weeks.account_key
    AND vwp.week_start = latest_weeks.max_week_start
);