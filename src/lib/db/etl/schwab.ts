import { db } from "@/lib/db/config";
import { sql } from "drizzle-orm";

export interface SchwabActivity {
  activityId: number; // Unique identifier for each transaction/activity (maps to transactionId in DB)
  time: string;
  accountNumber: string;
  type: string;
  status: string;
  subAccount: string;
  tradeDate: string;
  description?: string; // Optional description field for various activity types
  positionId?: number;
  orderId?: number; // May be shared across multiple transactions from the same order
  netAmount: number;
  transferItems: TransferItem[];
}

interface TransferItem {
  instrument: Instrument;
  amount: number;
  cost: number;
  price?: number;
  positionEffect?: "OPENING" | "CLOSING";
  feeType?: string;
}

interface Instrument {
  assetType: "CURRENCY" | "OPTION" | "EQUITY" | "COLLECTIVE_INVESTMENT";
  status: string;
  symbol: string;
  description: string;
  instrumentId: number;
  closingPrice: number;
  // Option-specific fields
  expirationDate?: string;
  optionDeliverables?: OptionDeliverable[];
  optionPremiumMultiplier?: number;
  putCall?: "PUT" | "CALL";
  strikePrice?: number;
  type?: string;
  underlyingSymbol?: string;
  underlyingCusip?: string;
}

interface OptionDeliverable {
  rootSymbol: string;
  strikePercent: number;
  deliverableNumber: number;
  deliverableUnits: number;
  deliverable?: any;
}

export async function processSchwabTransactions(stgTransactionIds: number[]) {
  if (stgTransactionIds.length === 0) {
    return { processed: 0, failed: 0, errors: [] };
  }

  // Convert array to PostgreSQL array format
  const idsArray = `{${stgTransactionIds.join(",")}}`;

  const result = await db.execute(sql`
    -- CTE 1: Extract and parse JSON data from staging table
    WITH parsed_transactions AS (
      SELECT 
        stg.id,
        stg.account_key,
        stg.broker_code,
        stg.broker_transaction_id,
        stg.raw_data,
        
        -- Extract security item from transferItems array
        (
          SELECT item
          FROM jsonb_array_elements(stg.raw_data->'transferItems') AS item
          WHERE item->'instrument'->>'assetType' IN ('OPTION', 'EQUITY', 'COLLECTIVE_INVESTMENT')
          LIMIT 1
        ) AS security_item,
        
        -- Calculate total fees
        COALESCE((
          SELECT SUM(ABS((item->>'cost')::numeric))
          FROM jsonb_array_elements(stg.raw_data->'transferItems') AS item
          WHERE item->>'feeType' IS NOT NULL
        ), 0) AS total_fees,
        
        -- Extract main transaction data
        stg.raw_data->>'tradeDate' AS trade_date,
        stg.raw_data->>'time' AS transaction_time,
        stg.raw_data->>'activityId' AS activity_id,
        stg.raw_data->>'orderId' AS order_id,
        stg.raw_data->>'type' AS schwab_type,
        stg.raw_data->>'description' AS tx_description,
        (stg.raw_data->>'netAmount')::numeric AS net_amount
        
      FROM stg_transaction stg
      WHERE stg.id = ANY(${idsArray}::int[])
    ),
    
    -- CTE 2: Determine action codes using the same logic as your helper function
    transaction_types AS (
      SELECT 
        pt.*,
        pt.security_item->'instrument'->>'assetType' AS asset_type,
        pt.security_item->>'positionEffect' AS position_effect,
        COALESCE((pt.security_item->>'amount')::numeric, pt.net_amount, 0) AS amount,
        
        -- Replicate getSchwabTransactionType logic
        CASE 
          WHEN pt.schwab_type = 'TRADE' THEN
            CASE 
              WHEN pt.security_item->'instrument'->>'assetType' = 'OPTION' THEN
                CASE 
                  WHEN pt.security_item->>'positionEffect' = 'OPENING' THEN
                    CASE WHEN COALESCE((pt.security_item->>'amount')::numeric, 0) < 0 
                        THEN 'sell_to_open' ELSE 'buy_to_open' END
                  WHEN pt.security_item->>'positionEffect' = 'CLOSING' THEN
                    CASE WHEN COALESCE((pt.security_item->>'amount')::numeric, 0) < 0 
                        THEN 'sell_to_close' ELSE 'buy_to_close' END
                  ELSE 'other'
                END
              ELSE
                CASE WHEN COALESCE(pt.net_amount, 0) < 0
                    THEN 'buy' ELSE 'sell' END
            END
          
          
          WHEN pt.schwab_type = 'DIVIDEND_OR_INTEREST' THEN
            CASE 
              WHEN UPPER(COALESCE(pt.tx_description, '')) LIKE '%DIV%' THEN 'dividend'
              WHEN UPPER(COALESCE(pt.tx_description, '')) LIKE '%INT%' THEN 'interest'
              ELSE 'dividend_interest'
            END
            
          WHEN pt.schwab_type IN ('WIRE_IN', 'WIRE_OUT') THEN 'transfer'
          
          WHEN pt.schwab_type = 'RECEIVE_AND_DELIVER' THEN
            CASE 
              WHEN UPPER(COALESCE(pt.tx_description, '')) LIKE '%EXPIRATION%' THEN 'expire'
              WHEN UPPER(COALESCE(pt.tx_description, '')) LIKE '%ASSIGNMENT%' 
                   OR UPPER(COALESCE(pt.tx_description, '')) LIKE '%EXERCISE%' THEN 'assign'
              ELSE 'expire'
            END
            
          ELSE 'other'
        END AS action_code
        
      FROM parsed_transactions pt
    ),
    
    -- CTE 3: Insert only securities that don't already exist
    upserted_securities AS (
      INSERT INTO dim_security (
        symbol, security_type, option_type, strike_price, expiry_date, security_name, underlying_symbol
      )
      SELECT DISTINCT
        tt.security_item->'instrument'->>'symbol' AS symbol,
        CASE WHEN tt.security_item->'instrument'->>'assetType' = 'OPTION' 
            THEN 'OPTION' ELSE 'STOCK' END AS security_type,
        tt.security_item->'instrument'->>'putCall' AS option_type,
        (tt.security_item->'instrument'->>'strikePrice')::numeric AS strike_price,
        CASE WHEN tt.security_item->'instrument'->>'expirationDate' IS NOT NULL
            THEN (tt.security_item->'instrument'->>'expirationDate')::date
            ELSE NULL END AS expiry_date,
        tt.security_item->'instrument'->>'description' AS security_name,
        COALESCE(
          tt.security_item->'instrument'->>'underlyingSymbol',
          tt.security_item->'instrument'->>'symbol'
        ) AS underlying_symbol
      FROM transaction_types tt
      WHERE tt.security_item IS NOT NULL
        AND tt.security_item->'instrument'->>'symbol' IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM dim_security ds 
          WHERE ds.symbol = tt.security_item->'instrument'->>'symbol'
            AND ds.underlying_symbol = COALESCE(
              tt.security_item->'instrument'->>'underlyingSymbol',
              tt.security_item->'instrument'->>'symbol'
            )
            AND ds.security_type = CASE WHEN tt.security_item->'instrument'->>'assetType' = 'OPTION' 
                                      THEN 'OPTION' ELSE 'STOCK' END
            AND COALESCE(ds.option_type, '') = COALESCE(tt.security_item->'instrument'->>'putCall', '')
            AND COALESCE(ds.strike_price, 0) = COALESCE((tt.security_item->'instrument'->>'strikePrice')::numeric, 0)
            AND COALESCE(ds.expiry_date, '1900-01-01'::date) = COALESCE((tt.security_item->'instrument'->>'expirationDate')::date, '1900-01-01'::date)
        )
      RETURNING security_key, symbol, underlying_symbol, security_type, option_type, strike_price, expiry_date
    ),
    
    -- CTE 4: Get all securities (existing + newly created) with full matching criteria
    all_securities AS (
      SELECT security_key, symbol, underlying_symbol, security_type, option_type, strike_price, expiry_date 
      FROM upserted_securities
      UNION ALL
      SELECT ds.security_key, ds.symbol, ds.underlying_symbol, ds.security_type, ds.option_type, ds.strike_price, ds.expiry_date
      FROM dim_security ds
      WHERE EXISTS (
        SELECT 1 FROM transaction_types tt
        WHERE tt.security_item IS NOT NULL
          AND ds.symbol = tt.security_item->'instrument'->>'symbol'
          AND ds.underlying_symbol = COALESCE(
            tt.security_item->'instrument'->>'underlyingSymbol',
            tt.security_item->'instrument'->>'symbol'
          )
          AND ds.security_type = CASE WHEN tt.security_item->'instrument'->>'assetType' = 'OPTION' 
                                    THEN 'OPTION' ELSE 'STOCK' END
          AND COALESCE(ds.option_type, '') = COALESCE(tt.security_item->'instrument'->>'putCall', '')
          AND COALESCE(ds.strike_price, 0) = COALESCE((tt.security_item->'instrument'->>'strikePrice')::numeric, 0)
          AND COALESCE(ds.expiry_date, '1900-01-01'::date) = COALESCE((tt.security_item->'instrument'->>'expirationDate')::date, '1900-01-01'::date)
      )
    ),
    
    -- CTE 5: Final data preparation with all JOINs
    final_data AS (
      SELECT
        tt.id AS stg_id,
        dd.date_key,
        dt.time_key,
        tt.account_key,
        COALESCE(s.security_key, NULL) AS security_key,
        dtt.transaction_type_key,
        db.broker_key,
        tt.activity_id AS broker_transaction_id,
        tt.order_id,
        COALESCE(tt.tx_description, tt.security_item->'instrument'->>'description', '') AS description,
        COALESCE((tt.security_item->>'amount')::numeric, 0) AS quantity,
        (tt.security_item->>'price')::numeric AS price_per_unit,
        COALESCE((tt.security_item->>'cost')::numeric, tt.net_amount, 0) AS gross_amount,
        tt.total_fees AS fees,
        tt.net_amount

      FROM transaction_types tt
      LEFT JOIN dim_date dd ON dd.full_date = tt.trade_date::date
      LEFT JOIN dim_time dt ON dt.time_value = TO_CHAR((tt.transaction_time::timestamptz AT TIME ZONE 'UTC')::time, 'HH24:MI:SS')
      LEFT JOIN dim_transaction_type dtt ON dtt.action_code = tt.action_code
      LEFT JOIN dim_broker db ON db.broker_code = tt.broker_code
      LEFT JOIN all_securities s ON (
        s.symbol = tt.security_item->'instrument'->>'symbol'
        AND s.underlying_symbol = COALESCE(
          tt.security_item->'instrument'->>'underlyingSymbol',
          tt.security_item->'instrument'->>'symbol'
        )
        AND s.security_type = CASE WHEN tt.security_item->'instrument'->>'assetType' = 'OPTION'
                                THEN 'OPTION' ELSE 'STOCK' END
        AND COALESCE(s.option_type, '') = COALESCE(tt.security_item->'instrument'->>'putCall', '')
        AND COALESCE(s.strike_price, 0) = COALESCE((tt.security_item->'instrument'->>'strikePrice')::numeric, 0)
        AND COALESCE(s.expiry_date, '1900-01-01'::date) = COALESCE((tt.security_item->'instrument'->>'expirationDate')::date, '1900-01-01'::date)
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

  return { processed, failed, errors };
}
