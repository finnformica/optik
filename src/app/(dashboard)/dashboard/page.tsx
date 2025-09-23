import AccountValueChart from "@/components/dashboard/account-value-chart";
import CurrentPositions from "@/components/dashboard/current-positions";
import PortfolioDistribution from "@/components/dashboard/portfolio-distribution";
import ProfitDistribution from "@/components/dashboard/profit-distribution";
import SummaryStats from "@/components/dashboard/summary-stats";
import WeeklyReturnsChart from "@/components/dashboard/weekly-returns-chart";
import { getAccountKey } from "@/lib/auth/session";
import { db } from "@/lib/db/config";
import {
  viewPortfolioDistribution,
  viewPortfolioSummary,
  viewPosition,
  viewProfitDistribution,
  viewWeeklyReturn,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export default async function DashboardPage() {
  const accountKey = await getAccountKey();

  // Fetch all analytics data in parallel
  const [
    positionsData,
    distributionData,
    profitDistributionData,
    [{ cashBalance }],
    weeklyReturnsData,
  ] = await Promise.all([
    // Current positions
    db
      .select()
      .from(viewPosition)
      .where(
        and(
          eq(viewPosition.accountKey, accountKey),
          eq(viewPosition.positionStatus, "OPEN")
        )
      )
      .limit(50),
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
