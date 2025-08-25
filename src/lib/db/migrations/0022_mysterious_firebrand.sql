CREATE OR REPLACE VIEW "public"."positions_by_symbol" AS (
  SELECT 
    user_id,
    ticker,
    CASE WHEN is_open = 'true' THEN 'OPEN' ELSE 'CLOSED' END as position_type,
    COUNT(*)::text as total_positions,
    SUM(total_pnl::numeric)::text as total_pnl,
    SUM(realized_pnl::numeric)::text as realized_pnl,
    SUM(unrealized_pnl::numeric)::text as unrealized_pnl,
    SUM(total_fees::numeric)::text as total_fees,
    SUM(CASE WHEN is_expiring_soon::boolean = true THEN 1 ELSE 0 END)::text as expiring_soon_count,
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'positionKey', position_key,
        'ticker', ticker,
        'optionType', option_type,
        'strikePrice', strike_price,
        'netQuantity', net_quantity,
        'totalPnl', total_pnl,
        'realizedPnl', realized_pnl,
        'unrealizedPnl', unrealized_pnl,
        'costBasis', cost_basis,
        'totalFees', total_fees,
        'openedAt', opened_at,
        'closedAt', closed_at,
        'lastTransactionAt', last_transaction_at,
        'daysHeld', days_held,
        'isExpiringSoon', is_expiring_soon,
        'transactions', transaction_details::json
      ) ORDER BY COALESCE(closed_at, last_transaction_at) DESC
    )::text as positions_data
  FROM positions
  GROUP BY user_id, ticker, CASE WHEN is_open = 'true' THEN 'OPEN' ELSE 'CLOSED' END
  ORDER BY user_id, SUM(total_pnl::numeric) DESC, ticker
);