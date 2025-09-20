-- Populate week_starting_date field to fix weekly returns chart
-- This ensures weeks always start on Monday and are consistent regardless of current date
UPDATE dim_date
SET week_starting_date = (
    -- Find first Monday for the date range starting 2020-01-01 (which was a Wednesday)
    -- 2019-12-30 was the Monday before 2020-01-01
    '2019-12-30'::DATE + INTERVAL '7 days' * FLOOR((full_date - '2019-12-30'::DATE) / 7)
)::DATE
WHERE week_starting_date IS NULL;