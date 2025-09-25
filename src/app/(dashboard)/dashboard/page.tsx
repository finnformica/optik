import AccountValueChart from "@/components/dashboard/account-value-chart";
import CurrentPositions from "@/components/dashboard/current-positions";
import PortfolioDistribution from "@/components/dashboard/portfolio-distribution";
import ProfitDistribution from "@/components/dashboard/profit-distribution";
import SummaryStats from "@/components/dashboard/summary-stats";
import WeeklyReturnsChart from "@/components/dashboard/weekly-returns-chart";
import { getCurrentAccountKey } from "@/lib/supabase/server";
import { db } from "@/lib/db/config";
import {
  viewPortfolioDistribution,
  viewPortfolioSummary,
  viewProfitDistribution,
  viewWeeklyReturn,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPositionsWithPrices } from "./actions";

export default async function DashboardPage() {
  const accountKey = await getCurrentAccountKey();

  // Fetch all analytics data in parallel
  const [
    positionsData,
    distributionData,
    profitDistributionData,
    [{ cashBalance }],
    weeklyReturnsData,
  ] = await Promise.all([
    // Current positions with stock prices
    getPositionsWithPrices(accountKey),
    // Portfolio distribution
    db
      .select()
      .from(viewPortfolioDistribution)
      .where(eq(viewPortfolioDistribution.accountKey, accountKey))
      .limit(20),
    // Profit distribution
    db
      .select()
      .from(viewProfitDistribution)
      .where(eq(viewProfitDistribution.accountKey, accountKey))
      .limit(20),
    // Cash balance
    db
      .select({ cashBalance: viewPortfolioSummary.cashBalance })
      .from(viewPortfolioSummary)
      .where(eq(viewPortfolioSummary.accountKey, accountKey))
      .limit(1),
    // Weekly returns
    db
      .select()
      .from(viewWeeklyReturn)
      .where(eq(viewWeeklyReturn.accountKey, accountKey))
      .limit(52),
  ]);

  return (
    <div className="space-y-6">
      <SummaryStats />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <WeeklyReturnsChart weeklyData={weeklyReturnsData} />
        <AccountValueChart accountValueData={weeklyReturnsData} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CurrentPositions positions={positionsData} />
        <PortfolioDistribution
          distribution={distributionData}
          cashBalance={Number(cashBalance)}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div />
        <ProfitDistribution profitData={profitDistributionData} />
      </div>
    </div>
  );
}
