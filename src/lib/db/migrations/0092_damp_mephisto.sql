CREATE OR REPLACE VIEW "public"."view_stock_profit" WITH (security_invoker = true) AS (
  WITH stock_transactions AS (
    -- Get all stock transactions ordered by date
    SELECT
      ft.transaction_key,
      ft.account_key,
      ds.symbol,
      ds.underlying_symbol,
      d.full_date as transaction_date,
      tt.action_code as transaction_type,
      ft.quantity,
      ft.price_per_unit,
      ft.net_amount,
      ROW_NUMBER() OVER (
        PARTITION BY ft.account_key, ds.symbol
        ORDER BY d.full_date, ft.transaction_key
      ) as transaction_sequence
    FROM "fact_transaction" ft
    JOIN "dim_security" ds ON ft.security_key = ds.security_key
    JOIN "dim_date" d ON ft.date_key = d.date_key
    JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE ds.security_type = 'STOCK'
      AND tt.action_category = 'TRADE'
  ),

  running_calculations AS (
    SELECT
      st.*,
      -- Running quantity (cumulative shares owned)
      SUM(st.quantity) OVER (
        PARTITION BY st.account_key, st.symbol
        ORDER BY st.transaction_sequence
        ROWS UNBOUNDED PRECEDING
      ) as running_quantity,

      -- Running cost basis (remaining cost basis of held shares)
      -- This represents the total cost of shares still owned
      CASE
        WHEN SUM(st.quantity) OVER (
          PARTITION BY st.account_key, st.symbol
          ORDER BY st.transaction_sequence
          ROWS UNBOUNDED PRECEDING
        ) > 0 THEN
          SUM(st.quantity) OVER (
            PARTITION BY st.account_key, st.symbol
            ORDER BY st.transaction_sequence
            ROWS UNBOUNDED PRECEDING
          ) * (
            SUM(CASE WHEN st.quantity > 0 THEN ABS(st.net_amount) ELSE 0 END) OVER (
              PARTITION BY st.account_key, st.symbol
              ORDER BY st.transaction_sequence
              ROWS UNBOUNDED PRECEDING
            ) / NULLIF(SUM(CASE WHEN st.quantity > 0 THEN st.quantity ELSE 0 END) OVER (
              PARTITION BY st.account_key, st.symbol
              ORDER BY st.transaction_sequence
              ROWS UNBOUNDED PRECEDING
            ), 0)
          )
        ELSE 0
      END as running_cost_basis,

      -- Average cost per share up to this point (for shares still owned)
      CASE
        WHEN SUM(CASE WHEN st.quantity > 0 THEN st.quantity ELSE 0 END) OVER (
          PARTITION BY st.account_key, st.symbol
          ORDER BY st.transaction_sequence
          ROWS UNBOUNDED PRECEDING
        ) > 0
        THEN SUM(CASE WHEN st.quantity > 0 THEN ABS(st.net_amount) ELSE 0 END) OVER (
          PARTITION BY st.account_key, st.symbol
          ORDER BY st.transaction_sequence
          ROWS UNBOUNDED PRECEDING
        ) / SUM(CASE WHEN st.quantity > 0 THEN st.quantity ELSE 0 END) OVER (
          PARTITION BY st.account_key, st.symbol
          ORDER BY st.transaction_sequence
          ROWS UNBOUNDED PRECEDING
        )
        ELSE 0
      END as avg_cost_per_share
    FROM stock_transactions st
  ),

  profit_calculations AS (
    SELECT
      rc.*,
      -- Calculate realized profit for sell transactions only
      CASE
        WHEN rc.quantity < 0 THEN
          -- For sells: (sale_price - avg_cost) * shares_sold
          (ABS(rc.net_amount) / ABS(rc.quantity)) * ABS(rc.quantity) -
          (rc.avg_cost_per_share * ABS(rc.quantity))
        ELSE 0
      END as realized_profit
    FROM running_calculations rc
  )

  SELECT
    pc.account_key,
    pc.symbol,
    pc.underlying_symbol,
    pc.transaction_date,
    pc.transaction_key,
    pc.transaction_type,
    pc.quantity,
    pc.price_per_unit,
    pc.net_amount,
    pc.running_quantity,
    pc.running_cost_basis,
    pc.avg_cost_per_share,
    pc.realized_profit,
    -- Cumulative realized profit over time
    SUM(pc.realized_profit) OVER (
      PARTITION BY pc.account_key, pc.symbol
      ORDER BY pc.transaction_sequence
      ROWS UNBOUNDED PRECEDING
    ) as cumulative_realized_profit
  FROM profit_calculations pc
  ORDER BY pc.account_key, pc.symbol, pc.transaction_sequence
);