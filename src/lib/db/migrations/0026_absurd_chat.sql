DROP VIEW "public"."portfolio_summary";--> statement-breakpoint
DROP VIEW "public"."weekly_performance";--> statement-breakpoint
CREATE VIEW "public"."weekly_performance" AS (
      WITH account_data_by_period AS (
        SELECT 
          user_id,
          DATE_TRUNC('week', week_start::date) as period_start,
          -- Get the latest values for each period (since we might group multiple weeks)
          MAX(cumulative_transfers::numeric) as period_cumulative_transfers,
          MAX(cumulative_portfolio_value::numeric) as period_cumulative_value
        FROM account_value_over_time
        GROUP BY user_id, DATE_TRUNC('week', week_start::date)
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
    );
CREATE VIEW "public"."monthly_performance" AS (
      WITH account_data_by_period AS (
        SELECT 
          user_id,
          DATE_TRUNC('month', week_start::date) as period_start,
          -- Get the latest values for each period (since we might group multiple weeks)
          MAX(cumulative_transfers::numeric) as period_cumulative_transfers,
          MAX(cumulative_portfolio_value::numeric) as period_cumulative_value
        FROM account_value_over_time
        GROUP BY user_id, DATE_TRUNC('month', week_start::date)
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
    );--> statement-breakpoint
CREATE VIEW "public"."yearly_performance" AS (
      WITH account_data_by_period AS (
        SELECT 
          user_id,
          DATE_TRUNC('year', week_start::date) as period_start,
          -- Get the latest values for each period (since we might group multiple weeks)
          MAX(cumulative_transfers::numeric) as period_cumulative_transfers,
          MAX(cumulative_portfolio_value::numeric) as period_cumulative_value
        FROM account_value_over_time
        GROUP BY user_id, DATE_TRUNC('year', week_start::date)
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
    );--> statement-breakpoint
CREATE VIEW "public"."portfolio_summary" AS (
  WITH latest_portfolio AS (
    SELECT DISTINCT ON (user_id) 
      user_id, 
      cumulative_portfolio_value
    FROM account_value_over_time 
    ORDER BY user_id, week_start DESC
  ),
  latest_weekly AS (
    SELECT DISTINCT ON (user_id) 
      user_id, 
      period_pnl as weekly_pnl, 
      period_pnl_percent as weekly_pnl_percent
    FROM weekly_performance 
    ORDER BY user_id, period_start DESC
  ),
  latest_monthly AS (
    SELECT DISTINCT ON (user_id) 
      user_id, 
      period_pnl as monthly_pnl, 
      period_pnl_percent as monthly_pnl_percent
    FROM monthly_performance 
    ORDER BY user_id, period_start DESC
  ),
  latest_yearly AS (
    SELECT DISTINCT ON (user_id) 
      user_id, 
      period_pnl as yearly_pnl, 
      period_pnl_percent as yearly_pnl_percent
    FROM yearly_performance 
    ORDER BY user_id, period_start DESC
  ),
  position_costs AS (
    SELECT 
      user_id,
      COALESCE(SUM(cost_basis::numeric), 0) as total_position_cost
    FROM positions
    GROUP BY user_id
  )
  SELECT 
    lp.user_id,
    lp.cumulative_portfolio_value as portfolio_value,
    (lp.cumulative_portfolio_value::numeric - COALESCE(pc.total_position_cost, 0))::text as cash_balance,
    COALESCE(lw.weekly_pnl, '0') as weekly_pnl,
    COALESCE(lm.monthly_pnl, '0') as monthly_pnl,
    COALESCE(ly.yearly_pnl, '0') as yearly_pnl,
    COALESCE(lw.weekly_pnl_percent, '0') as weekly_pnl_percent,
    COALESCE(lm.monthly_pnl_percent, '0') as monthly_pnl_percent,
    COALESCE(ly.yearly_pnl_percent, '0') as yearly_pnl_percent
  FROM latest_portfolio lp
  LEFT JOIN position_costs pc ON lp.user_id = pc.user_id
  LEFT JOIN latest_weekly lw ON lp.user_id = lw.user_id
  LEFT JOIN latest_monthly lm ON lp.user_id = lm.user_id
  LEFT JOIN latest_yearly ly ON lp.user_id = ly.user_id
);--> statement-breakpoint