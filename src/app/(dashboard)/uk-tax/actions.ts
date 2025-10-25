import { db } from "@/lib/db/config";
import {
  dimDate,
  dimSecurity,
  dimTransactionType,
  factTransaction,
  viewStockProfit,
} from "@/lib/db/schema";
import { getAccountKey } from "@/lib/supabase/server";
import { and, eq, gte, lte, sql } from "drizzle-orm";

// Function to get USD to GBP exchange rate
async function getUsdToGbpRate(): Promise<number> {
  try {
    // Using ExchangeRate-API (free tier: 1500 requests/month)
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD",
    );
    const data = await response.json();
    return data.rates.GBP || 0.8; // Fallback to approximate rate if API fails
  } catch (error) {
    console.warn("Failed to fetch exchange rate, using fallback:", error);
    return 0.8; // Approximate USD to GBP rate as fallback
  }
}

export interface TradingProfitLoss {
  totalProfitsUsd: number;
  totalLossesUsd: number;
  totalFeesUsd: number;
  netGainUsd: number;
  netGainGbp: number;
  stockProfits: number;
  stockLosses: number;
  stockFees: number;
  optionsGrossProfits: number;
  optionsGrossLosses: number;
  optionsFees: number;
  exchangeRate: number; // USD to GBP
}

export interface CgtCalculation {
  netGainGbp: number;
  annualAllowance: number;
  taxableGain: number;
  cgtLiability18: number;
  cgtLiability24: number;
}

export async function getUkTaxData() {
  const accountKey = await getAccountKey();

  // UK tax year 2025/26: April 6, 2025 to April 5, 2026
  const taxYearStart = "2025-04-06";
  const taxYearEnd = "2026-04-05";

  // Get exchange rate
  const exchangeRate = await getUsdToGbpRate();

  // Get all stock realized profits/losses for the tax year
  const stockTrades = await db
    .select({
      realizedProfit: viewStockProfit.realizedProfit,
    })
    .from(viewStockProfit)
    .where(
      and(
        eq(viewStockProfit.accountKey, accountKey),
        gte(viewStockProfit.transactionDate, taxYearStart),
        lte(viewStockProfit.transactionDate, taxYearEnd),
        sql`${viewStockProfit.realizedProfit} != 0`, // Only actual realized gains/losses
      ),
    );

  // Get stock fees separately (only stock trades)
  const stockFees = await db
    .select({
      fees: factTransaction.fees,
    })
    .from(factTransaction)
    .innerJoin(dimDate, eq(factTransaction.dateKey, dimDate.dateKey))
    .innerJoin(
      dimSecurity,
      eq(factTransaction.securityKey, dimSecurity.securityKey),
    )
    .innerJoin(
      dimTransactionType,
      eq(
        factTransaction.transactionTypeKey,
        dimTransactionType.transactionTypeKey,
      ),
    )
    .where(
      and(
        eq(factTransaction.accountKey, accountKey),
        eq(dimSecurity.securityType, "STOCK"),
        eq(dimTransactionType.actionCategory, "TRADE"),
        gte(dimDate.fullDate, taxYearStart),
        lte(dimDate.fullDate, taxYearEnd),
      ),
    );

  // Get all options trades with detailed breakdown (netAmount and fees)
  const optionsTrades = await db
    .select({
      netAmount: factTransaction.netAmount,
      fees: factTransaction.fees,
      grossAmount:
        sql<number>`${factTransaction.netAmount} + ${factTransaction.fees}`.as(
          "grossAmount",
        ),
    })
    .from(factTransaction)
    .innerJoin(dimDate, eq(factTransaction.dateKey, dimDate.dateKey))
    .innerJoin(
      dimSecurity,
      eq(factTransaction.securityKey, dimSecurity.securityKey),
    )
    .innerJoin(
      dimTransactionType,
      eq(
        factTransaction.transactionTypeKey,
        dimTransactionType.transactionTypeKey,
      ),
    )
    .where(
      and(
        eq(factTransaction.accountKey, accountKey),
        eq(dimSecurity.securityType, "OPTION"),
        eq(dimTransactionType.actionCategory, "TRADE"),
        gte(dimDate.fullDate, taxYearStart),
        lte(dimDate.fullDate, taxYearEnd),
      ),
    );

  // Calculate stock profits and losses
  const stockProfits = stockTrades
    .filter((trade) => Number(trade.realizedProfit) > 0)
    .reduce((sum, trade) => sum + Number(trade.realizedProfit), 0);

  const stockLosses = Math.abs(
    stockTrades
      .filter((trade) => Number(trade.realizedProfit) < 0)
      .reduce((sum, trade) => sum + Number(trade.realizedProfit), 0),
  );

  const totalStockFees = stockFees.reduce(
    (sum, fee) => sum + Number(fee.fees),
    0,
  );

  // Calculate options gross profits/losses and fees
  const optionsGrossProfits = optionsTrades
    .filter((trade) => Number(trade.grossAmount) > 0)
    .reduce((sum, trade) => sum + Number(trade.grossAmount), 0);

  const optionsGrossLosses = Math.abs(
    optionsTrades
      .filter((trade) => Number(trade.grossAmount) < 0)
      .reduce((sum, trade) => sum + Number(trade.grossAmount), 0),
  );

  const totalOptionsFees = optionsTrades.reduce(
    (sum, trade) => sum + Number(trade.fees),
    0,
  );

  // Calculate totals in USD
  const totalProfitsUsd = stockProfits + optionsGrossProfits;
  const totalLossesUsd = stockLosses + optionsGrossLosses;
  const totalFeesUsd = totalStockFees + totalOptionsFees;
  const netGainUsd = totalProfitsUsd - totalLossesUsd - totalFeesUsd;

  // Convert net gain to GBP for CGT calculation
  const netGainGbp = netGainUsd * exchangeRate;

  const profitLoss: TradingProfitLoss = {
    totalProfitsUsd,
    totalLossesUsd,
    totalFeesUsd,
    netGainUsd,
    netGainGbp,
    stockProfits,
    stockLosses,
    stockFees: totalStockFees,
    optionsGrossProfits,
    optionsGrossLosses,
    optionsFees: totalOptionsFees,
    exchangeRate,
  };

  // CGT calculation in GBP
  const annualAllowance = 3000; // 2025/26 CGT allowance in GBP
  const taxableGain = Math.max(0, netGainGbp - annualAllowance);
  const cgtLiability18 = taxableGain * 0.18; // Basic rate
  const cgtLiability24 = taxableGain * 0.24; // Higher rate

  const cgtCalculation: CgtCalculation = {
    netGainGbp,
    annualAllowance,
    taxableGain,
    cgtLiability18,
    cgtLiability24,
  };

  return {
    profitLoss,
    cgtCalculation,
  };
}
