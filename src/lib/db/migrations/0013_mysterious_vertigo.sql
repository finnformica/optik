CREATE VIEW "public"."positions_by_symbol" AS (
  WITH position_aggregates AS (
    -- Get open positions with aggregations
    SELECT 
      user_id,
      ticker,
      'OPEN' as position_type,
      COUNT(*) as total_positions,
      SUM(total_pnl::numeric) as total_pnl,
      SUM(total_fees::numeric) as total_fees,
      SUM(CASE WHEN is_expiring_soon = true THEN 1 ELSE 0 END) as expiring_soon_count,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'positionKey', position_key,
          'ticker', ticker,
          'optionType', option_type,
          'strikePrice', strike_price,
          'strategy', strategy,
          'netQuantity', net_quantity,
          'totalPnl', total_pnl,
          'realizedPnl', realized_pnl,
          'costBasis', cost_basis,
          'totalFees', total_fees,
          'openedAt', opened_at,
          'lastTransactionAt', last_transaction_at,
          'daysHeld', days_held,
          'isExpiringSoon', is_expiring_soon,
          'transactions', transaction_details
        ) ORDER BY opened_at DESC
      ) as positions_data
    FROM open_positions
    GROUP BY user_id, ticker
    
    UNION ALL
    
    -- Get closed positions with aggregations
    SELECT 
      user_id,
      ticker,
      'CLOSED' as position_type,
      COUNT(*) as total_positions,
      SUM(total_pnl::numeric) as total_pnl,
      SUM(total_fees::numeric) as total_fees,
      0 as expiring_soon_count,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'positionKey', position_key,
          'ticker', ticker,
          'optionType', option_type,
          'strikePrice', strike_price,
          'strategy', strategy,
          'netQuantity', net_quantity,
          'totalPnl', total_pnl,
          'realizedPnl', realized_pnl,
          'costBasis', cost_basis,
          'totalFees', total_fees,
          'openedAt', opened_at,
          'closedAt', closed_at,
          'lastTransactionAt', last_transaction_at,
          'daysHeld', days_held,
          'isExpiringSoon', is_expiring_soon,
          'transactions', transaction_details
        ) ORDER BY closed_at DESC
      ) as positions_data
    FROM closed_positions
    GROUP BY user_id, ticker
  )
  SELECT 
    user_id,
    ticker,
    position_type,
    total_positions::text,
    total_pnl::text,
    total_fees::text,
    expiring_soon_count::text,
    positions_data::text
  FROM position_aggregates
  ORDER BY user_id, total_pnl DESC, ticker
);