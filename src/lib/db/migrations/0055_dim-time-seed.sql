INSERT INTO dim_time (
      time_key,
      time_value,
      hour,
      minute,
      second,
      hour_minute,
      period_of_day,
      is_market_hours,
      quarter_hour
)

SELECT
    -- Sequential time_key from 1 to 86400
    ROW_NUMBER() OVER (ORDER BY h, m, s) as time_key,

    -- Time value in HH:MM:SS format
    LPAD(h::text, 2, '0') || ':' ||
    LPAD(m::text, 2, '0') || ':' ||
    LPAD(s::text, 2, '0') as time_value,

    -- Individual components
    h as hour,
    m as minute,
    s as second,

    -- Hour:Minute format
    LPAD(h::text, 2, '0') || ':' || LPAD(m::text, 2, '0') as hour_minute,

    -- Period of day
    CASE
        WHEN h >= 0 AND h < 6 THEN 'Night'
        WHEN h >= 6 AND h < 12 THEN 'Morning'
        WHEN h >= 12 AND h < 18 THEN 'Afternoon'
        ELSE 'Evening'
    END as period_of_day,

    -- US Market hours (9:30 AM to 4:00 PM EST)
    CASE
        WHEN (h = 9 AND m >= 30) OR (h > 9 AND h < 16) OR (h = 16 AND m = 0 AND s = 0)
        THEN true
        ELSE false
    END as is_market_hours,

    -- Quarter hour intervals (1-96, representing 15-minute segments)
    ((h * 4) + (m / 15) + 1)::integer as quarter_hour

FROM generate_series(0, 23) h,
    generate_series(0, 59) m,
    generate_series(0, 59) s
ORDER BY h, m, s;