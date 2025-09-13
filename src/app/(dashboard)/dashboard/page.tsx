import AccountValueChart from "@/components/dashboard/account-value-chart";
import CurrentPositions from "@/components/dashboard/current-positions";
import PortfolioDistribution from "@/components/dashboard/portfolio-distribution";
import SummaryStats from "@/components/dashboard/summary-stats";
import WeeklyReturnsChart from "@/components/dashboard/weekly-returns-chart";
import { db } from "@/lib/db/config";
import { getCurrentAccount } from "@/lib/db/queries";
import {
  viewPortfolioDistribution,
  viewPositions,
  viewWeeklyReturns,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export default async function DashboardPage() {
  // Get current account from session
  const currentAccount = await getCurrentAccount();

  if (!currentAccount) {
    return <div>No account found</div>;
  }

  // Fetch all analytics data in parallel
  const [positionsData, distributionData, accountValueData, weeklyReturnsData] =
    await Promise.all([
      db
        .select()
        .from(viewPositions)
        .where(
          and(
            eq(viewPositions.accountKey, currentAccount.accountKey),
            eq(viewPositions.positionStatus, "OPEN")
          )
        )
        .limit(50),
      db
        .select()
        .from(viewPortfolioDistribution)
        .where(
          eq(viewPortfolioDistribution.accountKey, currentAccount.accountKey)
        )
        .limit(20),
      db
        .select()
        .from(viewWeeklyReturns)
        .where(eq(viewWeeklyReturns.accountKey, currentAccount.accountKey))
        .limit(52),
      db
        .select()
        .from(viewWeeklyReturns)
        .where(eq(viewWeeklyReturns.accountKey, currentAccount.accountKey))
        .limit(52),
    ]);

  return (
    <div className="space-y-6">
      <SummaryStats />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <WeeklyReturnsChart weeklyData={weeklyReturnsData} />
        <AccountValueChart accountValueData={accountValueData} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CurrentPositions positions={positionsData} />
        <PortfolioDistribution
          distribution={distributionData}
          cashBalance={300}
        />
      </div>
    </div>
  );
}
