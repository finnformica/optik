export function createPerformanceViewSQL(period: 'week' | 'month' | 'year') {
    return `
      WITH account_data_by_period AS (
        SELECT 
          user_id,
          DATE_TRUNC('${period}', week_start::date) as period_start,
          -- Get the latest values for each period (since we might group multiple weeks)
          MAX(cumulative_transfers::numeric) as period_cumulative_transfers,
          MAX(cumulative_portfolio_value::numeric) as period_cumulative_value
        FROM account_value_over_time
        GROUP BY user_id, DATE_TRUNC('${period}', week_start::date)
      ),
      period_with_previous AS (
        SELECT 
          user_id,
          period_start,
          period_cumulative_transfers as current_transfers,
          period_cumulative_value as current_portfolio,
          LAG(period_cumulative_transfers) OVER (PARTITION BY user_id ORDER BY period_start) as prev_transfers,
          LAG(period_cumulative_value) OVER (PARTITION BY user_id ORDER BY period_start) as prev_portfolio
        FROM account_data_by_period
      )
      SELECT 
        user_id,
        period_start,
        -- Period P&L = portfolio change minus transfers
        (current_portfolio - COALESCE(prev_portfolio, 0)) - 
        (current_transfers - COALESCE(prev_transfers, 0)) as period_pnl,
        -- Period percentage
        CASE 
          WHEN prev_portfolio > 0
          THEN ((current_portfolio - prev_portfolio) - (current_transfers - prev_transfers)) * 100.0 / prev_portfolio
          ELSE 0
        END as period_pnl_percent,
        current_portfolio as portfolio_value,
        current_transfers - COALESCE(prev_transfers, 0) as period_transfers
      FROM period_with_previous
      WHERE prev_portfolio IS NOT NULL  -- Exclude first period
      ORDER BY user_id, period_start DESC
    `;
  }