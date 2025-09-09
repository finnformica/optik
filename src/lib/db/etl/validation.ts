import { db } from "@/lib/db/config";
import { viewPositions, factTransactions, dimAccount } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Debug queries to validate position calculations
 */

export async function validatePositionCalculations(userId: number) {
  console.log(`\n=== Position Validation for User ${userId} ===`);

  // 1. Check total portfolio value from transactions
  const portfolioValue = await db.execute(sql`
    SELECT 
      SUM(ft.net_amount) as total_portfolio_value,
      COUNT(*) as transaction_count
    FROM fact_transactions ft
    JOIN dim_account a ON ft.account_key = a.account_key
    WHERE a.user_id = ${userId}
  `);
  
  console.log("Portfolio Value (from all transactions):");
  console.log(portfolioValue[0]);

  // 2. Check position values
  const positionValues = await db.execute(sql`
    SELECT 
      position_status,
      COUNT(*) as position_count,
      SUM(cost_basis) as total_cost_basis,
      SUM(ABS(cost_basis)) as total_abs_cost_basis
    FROM view_positions
    WHERE user_id = ${userId}
    GROUP BY position_status
    ORDER BY position_status
  `);

  console.log("\nPosition Values by Status:");
  positionValues.forEach(row => console.log(row));

  // 3. Check for potential issues
  const potentialIssues = await db.execute(sql`
    SELECT 
      symbol,
      security_type,
      quantity_held,
      cost_basis,
      position_status,
      expiry_date,
      CASE WHEN expiry_date < CURRENT_DATE THEN 'EXPIRED' ELSE 'ACTIVE' END as expiry_status
    FROM view_positions
    WHERE user_id = ${userId}
      AND (
        -- Very small positions that might be rounding errors
        (ABS(quantity_held) < 0.01 AND position_status = 'OPEN')
        OR
        -- Expired options still showing as open
        (security_type = 'OPTION' AND expiry_date < CURRENT_DATE AND position_status = 'OPEN')
      )
    ORDER BY symbol
  `);

  console.log("\nPotential Issues:");
  if (potentialIssues.length === 0) {
    console.log("No issues found");
  } else {
    potentialIssues.forEach(row => console.log(row));
  }

  // 4. Calculate expected cash balance
  const cashCalc = await db.execute(sql`
    WITH portfolio_val AS (
      SELECT SUM(ft.net_amount) as total_portfolio
      FROM fact_transactions ft
      JOIN dim_account a ON ft.account_key = a.account_key
      WHERE a.user_id = ${userId}
    ),
    position_val AS (
      SELECT SUM(cost_basis) as total_positions
      FROM view_positions
      WHERE user_id = ${userId} AND position_status = 'OPEN'
    )
    SELECT 
      p.total_portfolio,
      pos.total_positions,
      (p.total_portfolio - COALESCE(pos.total_positions, 0)) as calculated_cash_balance
    FROM portfolio_val p
    CROSS JOIN position_val pos
  `);

  console.log("\nCash Balance Calculation:");
  console.log(cashCalc[0]);

  return {
    portfolioValue: portfolioValue[0],
    positionValues,
    potentialIssues,
    cashCalculation: cashCalc[0]
  };
}