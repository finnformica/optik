-- =============================================
-- POPULATE DATE DIMENSION (2020-2030)
-- =============================================
INSERT INTO dim_date (
    date_key, full_date, day_of_week, day_of_month, week_of_year, 
    month_name, month_number, quarter, year, is_weekend, is_trading_day, 
    week_ending_date, month_ending_date
)
SELECT 
    TO_CHAR(date_series, 'YYYYMMDD')::INTEGER as date_key,
    date_series as full_date,
    TO_CHAR(date_series, 'Day') as day_of_week,
    EXTRACT(DAY FROM date_series)::INTEGER as day_of_month,
    EXTRACT(WEEK FROM date_series)::INTEGER as week_of_year,
    TO_CHAR(date_series, 'Month') as month_name,
    EXTRACT(MONTH FROM date_series)::INTEGER as month_number,
    EXTRACT(QUARTER FROM date_series)::INTEGER as quarter,
    EXTRACT(YEAR FROM date_series)::INTEGER as year,
    EXTRACT(DOW FROM date_series) IN (0,6) as is_weekend,
    EXTRACT(DOW FROM date_series) NOT IN (0,6) as is_trading_day, -- Simplified (excludes holidays)
    (date_series + INTERVAL '6 days' - INTERVAL '1 day' * EXTRACT(DOW FROM date_series))::DATE as week_ending_date,
    (date_trunc('month', date_series) + INTERVAL '1 month' - INTERVAL '1 day')::DATE as month_ending_date
FROM generate_series('2020-01-01'::date, '2030-12-31'::date, '1 day'::interval) as date_series;

-- =============================================
-- POPULATE TRANSACTION TYPE DIMENSION
-- Maps to your existing transaction_action enum
-- =============================================
INSERT INTO dim_transaction_type (action_code, action_description, action_category, affects_position, direction) VALUES
('buy', 'Buy Stock/ETF', 'TRADE', true, -1),
('sell', 'Sell Stock/ETF', 'TRADE', true, 1),
('buy_to_open', 'Buy to Open (Long Position)', 'TRADE', true, -1),
('sell_to_close', 'Sell to Close (Exit Long)', 'TRADE', true, 1),
('sell_to_open', 'Sell to Open (Short Position)', 'TRADE', true, 1),
('buy_to_close', 'Buy to Close (Cover Short)', 'TRADE', true, -1),
('expire', 'Option Expiration', 'CORPORATE', true, 0),
('assign', 'Option Assignment', 'CORPORATE', true, 0),
('dividend', 'Dividend Payment', 'INCOME', false, 1),
('interest', 'Interest Payment', 'INCOME', false, 1),
('transfer', 'Cash Transfer', 'TRANSFER', false, 0),
('other', 'Other Transaction', 'OTHER', false, 0);

-- =============================================
-- POPULATE BROKER DIMENSION
-- Maps to your existing broker enum
-- =============================================
INSERT INTO dim_broker (broker_code, broker_name, commission_structure) VALUES
('schwab', 'Charles Schwab', '$0 stock trades, $0.65 per options contract'),
('robinhood', 'Robinhood', '$0 commission'),
('etrade', 'E*TRADE', '$0 stock trades, $0.65 per options contract'),
('fidelity', 'Fidelity', '$0 stock trades, $0.65 per options contract'),
('tda', 'TD Ameritrade', '$0 stock trades, $0.65 per options contract'),
('vanguard', 'Vanguard', '$0 stock trades, $1 per options contract');