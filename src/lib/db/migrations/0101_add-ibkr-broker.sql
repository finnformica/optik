-- Add Interactive Brokers to dim_broker table
INSERT INTO dim_broker (broker_code, broker_name, commission_structure, api_provider)
VALUES (
  'ibkr',
  'Interactive Brokers',
  '$0 stock trades, $0.65 per options contract',
  NULL
)
ON CONFLICT (broker_code) DO NOTHING;