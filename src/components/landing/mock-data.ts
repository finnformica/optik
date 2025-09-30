import type { ViewPortfolioSummary, ViewWeeklyReturn, ViewPortfolioDistribution } from "@/lib/db/schema";
import type { EnrichedPosition } from "@/app/(dashboard)/dashboard/actions";

// Mock portfolio summary data
export const mockPortfolioSummary: ViewPortfolioSummary = {
  accountKey: 1,
  portfolioValue: "17174.25",
  cashBalance: "-2926.00",
  availableCash: "-2926.00",
  stockPositionValue: "4500.00",
  optionCollateralValue: "12674.25",
  monthlyPnl: "1247.30",
  monthlyPnlPercent: "9.1",
  yearlyPnl: "2261.45",
  yearlyPnlPercent: "15.2",
  overallPercentIncrease: "15.2"
};

// Mock weekly returns data
export const mockWeeklyData: ViewWeeklyReturn[] = [
  {
    accountKey: 1,
    weekStart: "2024-07-21",
    cumulativePortfolioValue: "15000.00",
    cumulativeTransfers: "0.00",
    weeklyReturnAbsolute: "322.45",
    weeklyReturnPercent: "2.6"
  },
  {
    accountKey: 1,
    weekStart: "2024-07-28",
    cumulativePortfolioValue: "15356.78",
    cumulativeTransfers: "0.00",
    weeklyReturnAbsolute: "356.78",
    weeklyReturnPercent: "2.1"
  },
  {
    accountKey: 1,
    weekStart: "2024-08-04",
    cumulativePortfolioValue: "15781.90",
    cumulativeTransfers: "0.00",
    weeklyReturnAbsolute: "425.12",
    weeklyReturnPercent: "2.5"
  },
  {
    accountKey: 1,
    weekStart: "2024-08-11",
    cumulativePortfolioValue: "15980.35",
    cumulativeTransfers: "0.00",
    weeklyReturnAbsolute: "198.45",
    weeklyReturnPercent: "1.4"
  },
  {
    accountKey: 1,
    weekStart: "2024-08-18",
    cumulativePortfolioValue: "16269.65",
    cumulativeTransfers: "0.00",
    weeklyReturnAbsolute: "289.30",
    weeklyReturnPercent: "1.6"
  },
  {
    accountKey: 1,
    weekStart: "2024-08-25",
    cumulativePortfolioValue: "16648.55",
    cumulativeTransfers: "0.00",
    weeklyReturnAbsolute: "378.90",
    weeklyReturnPercent: "2.1"
  },
  {
    accountKey: 1,
    weekStart: "2024-09-01",
    cumulativePortfolioValue: "16804.22",
    cumulativeTransfers: "0.00",
    weeklyReturnAbsolute: "155.67",
    weeklyReturnPercent: "2.3"
  },
  {
    accountKey: 1,
    weekStart: "2024-09-08",
    cumulativePortfolioValue: "17216.55",
    cumulativeTransfers: "0.00",
    weeklyReturnAbsolute: "412.33",
    weeklyReturnPercent: "2.2"
  },
  {
    accountKey: 1,
    weekStart: "2024-09-15",
    cumulativePortfolioValue: "17614.67",
    cumulativeTransfers: "0.00",
    weeklyReturnAbsolute: "398.12",
    weeklyReturnPercent: "2.2"
  },
  {
    accountKey: 1,
    weekStart: "2024-09-22",
    cumulativePortfolioValue: "17849.23",
    cumulativeTransfers: "0.00",
    weeklyReturnAbsolute: "234.56",
    weeklyReturnPercent: "1.3"
  }
];

// Mock positions data
export const mockPositions: EnrichedPosition[] = [
  {
    accountKey: 1,
    symbol: "BAX",
    underlyingSymbol: "BAX",
    securityType: "STOCK",
    optionType: null,
    strikePrice: null,
    expiryDate: null,
    quantity: "200",
    avgCostPerUnit: "21.00",
    firstTransactionDate: "2024-01-15",
    lastTransactionDate: "2024-01-15",
    positionValue: "4476.00",
    positionStatus: "OPEN",
    unrealizedPnl: "276.00",
    currentPrice: 22.38,
    itmPercentage: undefined
  },
  {
    accountKey: 1,
    symbol: "BAX250310C00023000",
    underlyingSymbol: "BAX",
    securityType: "OPTION",
    optionType: "CALL",
    strikePrice: "23.00",
    expiryDate: "2025-03-10",
    quantity: "-1",
    avgCostPerUnit: "1.50",
    firstTransactionDate: "2024-02-15",
    lastTransactionDate: "2024-02-15",
    positionValue: "150.00",
    positionStatus: "OPEN",
    unrealizedPnl: "25.00",
    currentPrice: 22.38,
    itmPercentage: 2.7
  },
  {
    accountKey: 1,
    symbol: "BSWI250310P00025000",
    underlyingSymbol: "BSWI",
    securityType: "OPTION",
    optionType: "PUT",
    strikePrice: "25.00",
    expiryDate: "2025-03-10",
    quantity: "-2",
    avgCostPerUnit: "1.50",
    firstTransactionDate: "2024-03-15",
    lastTransactionDate: "2024-03-15",
    positionValue: "300.00",
    positionStatus: "OPEN",
    unrealizedPnl: "50.00",
    currentPrice: 26.06,
    itmPercentage: 4.2
  },
  {
    accountKey: 1,
    symbol: "GEO251010P00020000",
    underlyingSymbol: "GEO",
    securityType: "OPTION",
    optionType: "PUT",
    strikePrice: "20.00",
    expiryDate: "2025-10-10",
    quantity: "-2",
    avgCostPerUnit: "1.40",
    firstTransactionDate: "2024-04-15",
    lastTransactionDate: "2024-04-15",
    positionValue: "280.00",
    positionStatus: "OPEN",
    unrealizedPnl: "40.00",
    currentPrice: 20.98,
    itmPercentage: 4.9
  },
  {
    accountKey: 1,
    symbol: "GRPN250310P00023000",
    underlyingSymbol: "GRPN",
    securityType: "OPTION",
    optionType: "PUT",
    strikePrice: "23.00",
    expiryDate: "2025-03-10",
    quantity: "-1",
    avgCostPerUnit: "1.75",
    firstTransactionDate: "2024-05-15",
    lastTransactionDate: "2024-05-15",
    positionValue: "175.00",
    positionStatus: "OPEN",
    unrealizedPnl: "30.00",
    currentPrice: 23.25,
    itmPercentage: 1.1
  }
];

// Mock portfolio distribution data
export const mockPortfolioDistribution: ViewPortfolioDistribution[] = [
  { accountKey: 1, symbol: "BAX", positionValue: "4476.00", instrumentCount: 2, portfolioPercentage: "26.1" },
  { accountKey: 1, symbol: "BSWI", positionValue: "3200.00", instrumentCount: 1, portfolioPercentage: "18.6" },
  { accountKey: 1, symbol: "GEO", positionValue: "2800.00", instrumentCount: 1, portfolioPercentage: "16.3" },
  { accountKey: 1, symbol: "GRPN", positionValue: "1950.00", instrumentCount: 1, portfolioPercentage: "11.4" },
  { accountKey: 1, symbol: "RUM", positionValue: "3248.25", instrumentCount: 1, portfolioPercentage: "18.9" }
];