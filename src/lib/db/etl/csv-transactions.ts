import { sql } from "drizzle-orm";
import { db } from "@/lib/db/config";

/**
 * Processes CSV transactions from staging table to fact_transaction table
 * Works with standardized CSV data that was transformed during import
 */
export async function processCsvTransactions(stgTransactionIds: number[]) {
  if (stgTransactionIds.length === 0) {
    return { processed: 0, failed: 0, errors: [] };
  }

  // Convert array to PostgreSQL array format
  const idsArray = `{${stgTransactionIds.join(",")}}`;

  const result = await db.execute(sql`
    -- CTE 1: Extract standardized data from staging table (CSV format)
    WITH parsed_transactions AS (
      SELECT
        stg.id,
        stg.account_key,
        stg.broker_code,
        stg.broker_transaction_id,
        stg.raw_data,

        -- Extract standardized transaction data
        (stg.raw_data->>'transactionDate')::timestamptz AS transaction_timestamp,
        stg.raw_data->>'symbol' AS symbol,
        stg.raw_data->>'securityType' AS security_type,
        stg.raw_data->>'underlyingSymbol' AS underlying_symbol,
        stg.raw_data->>'optionType' AS option_type,
        (stg.raw_data->>'strikePrice')::numeric AS strike_price,
        CASE WHEN stg.raw_data->>'expiryDate' IS NOT NULL
             THEN (stg.raw_data->>'expiryDate')::date
             ELSE NULL END AS expiry_date,
        stg.raw_data->>'description' AS description,
        stg.raw_data->>'orderId' AS order_id,

        -- Financial data
        (stg.raw_data->>'quantity')::numeric AS quantity,
        (stg.raw_data->>'pricePerUnit')::numeric AS price_per_unit,
        (stg.raw_data->>'grossAmount')::numeric AS gross_amount,
        (stg.raw_data->>'fees')::numeric AS fees,
        (stg.raw_data->>'netAmount')::numeric AS net_amount,

        -- Action code for transaction type mapping
        stg.raw_data->>'actionCode' AS action_code

      FROM stg_transaction stg
      WHERE stg.id = ANY(${idsArray}::int[])
        AND stg.data_source = 'csv'
    ),

    -- CTE 2: Insert only securities that don't already exist (skip null security types)
    upserted_securities AS (
      INSERT INTO dim_security (
        symbol, security_type, option_type, strike_price, expiry_date, underlying_symbol
      )
      SELECT DISTINCT
        pt.symbol,
        pt.security_type,
        pt.option_type,
        pt.strike_price,
        pt.expiry_date,
        pt.underlying_symbol
      FROM parsed_transactions pt
      WHERE pt.symbol IS NOT NULL
        AND pt.security_type IS NOT NULL -- Only create securities for actual securities (not transfers)
        AND NOT EXISTS (
          SELECT 1 FROM dim_security ds
          WHERE ds.symbol = pt.symbol
            AND ds.underlying_symbol = pt.underlying_symbol
            AND ds.security_type = pt.security_type
            AND COALESCE(ds.option_type, '') = COALESCE(pt.option_type, '')
            AND COALESCE(ds.strike_price, 0) = COALESCE(pt.strike_price, 0)
            AND COALESCE(ds.expiry_date, '1900-01-01'::date) = COALESCE(pt.expiry_date, '1900-01-01'::date)
        )
      RETURNING security_key, symbol, underlying_symbol, security_type, option_type, strike_price, expiry_date
    ),

    -- CTE 3: Get all securities (existing + newly created)
    all_securities AS (
      SELECT security_key, symbol, underlying_symbol, security_type, option_type, strike_price, expiry_date
      FROM upserted_securities
      UNION ALL
      SELECT ds.security_key, ds.symbol, ds.underlying_symbol, ds.security_type, ds.option_type, ds.strike_price, ds.expiry_date
      FROM dim_security ds
      WHERE EXISTS (
        SELECT 1 FROM parsed_transactions pt
        WHERE pt.security_type IS NOT NULL -- Only match actual securities
          AND ds.symbol = pt.symbol
          AND ds.underlying_symbol = pt.underlying_symbol
          AND ds.security_type = pt.security_type
          AND COALESCE(ds.option_type, '') = COALESCE(pt.option_type, '')
          AND COALESCE(ds.strike_price, 0) = COALESCE(pt.strike_price, 0)
          AND COALESCE(ds.expiry_date, '1900-01-01'::date) = COALESCE(pt.expiry_date, '1900-01-01'::date)
      )
    ),

    -- CTE 4: Final data preparation with all JOINs
    final_data AS (
      SELECT
        pt.id AS stg_id,
        dd.date_key,
        dt.time_key,
        pt.account_key,
        COALESCE(s.security_key, NULL) AS security_key,
        dtt.transaction_type_key,
        db.broker_key,
        pt.broker_transaction_id,
        pt.order_id,
        COALESCE(pt.description, '') AS description,
        pt.quantity,
        pt.price_per_unit,
        pt.gross_amount,
        pt.fees,
        pt.net_amount

      FROM parsed_transactions pt
      LEFT JOIN dim_date dd ON dd.full_date = pt.transaction_timestamp::date
      LEFT JOIN dim_time dt ON dt.time_value = TO_CHAR((pt.transaction_timestamp AT TIME ZONE 'UTC')::time, 'HH24:MI:SS')
      LEFT JOIN dim_transaction_type dtt ON dtt.action_code = pt.action_code
      LEFT JOIN dim_broker db ON db.broker_code = pt.broker_code
      LEFT JOIN all_securities s ON (
        s.symbol = pt.symbol
        AND s.underlying_symbol = pt.underlying_symbol
        AND s.security_type = pt.security_type
        AND COALESCE(s.option_type, '') = COALESCE(pt.option_type, '')
        AND COALESCE(s.strike_price, 0) = COALESCE(pt.strike_price, 0)
        AND COALESCE(s.expiry_date, '1900-01-01'::date) = COALESCE(pt.expiry_date, '1900-01-01'::date)
      )
    ),

    -- Insert into fact table
    inserted_facts AS (
      INSERT INTO fact_transaction (
        date_key, time_key, account_key, security_key, transaction_type_key, broker_key,
        broker_transaction_id, order_id, description, quantity, price_per_unit,
        gross_amount, fees, net_amount
      )
      SELECT
        date_key, time_key, account_key, security_key, transaction_type_key, broker_key,
        broker_transaction_id, order_id, description, quantity, price_per_unit,
        gross_amount, fees, net_amount
      FROM final_data
      WHERE transaction_type_key IS NOT NULL
        AND time_key IS NOT NULL -- Only insert if we found valid transaction type and time
      RETURNING broker_transaction_id
    )

    -- Update staging table status for the processed batch
    UPDATE stg_transaction
    SET
      status = CASE
        WHEN broker_transaction_id IN (SELECT broker_transaction_id FROM inserted_facts)
        THEN 'COMPLETED'
        ELSE 'FAILED'
      END,
      processed_at = NOW(),
      error_message = CASE
        WHEN broker_transaction_id NOT IN (SELECT broker_transaction_id FROM inserted_facts)
        THEN 'Failed to process transaction - invalid transaction type or missing dimensions'
        ELSE NULL
      END
    WHERE id = ANY(${idsArray}::int[])
    RETURNING
      id,
      status,
      error_message,
      broker_transaction_id;
  `);

  // Process results to return summary
  const processed = result.filter(
    (row: any) => row.status === "COMPLETED"
  ).length;
  const failed = result.filter((row: any) => row.status === "FAILED").length;
  const errors = result
    .filter((row: any) => row.status === "FAILED")
    .map((row: any) => ({
      id: row.id,
      brokerTransactionId: row.broker_transaction_id,
      error: row.error_message,
    }));

  return {
    processed,
    failed,
    errors,
  };
}