import AccountValueChart from "@/components/dashboard/account-value-chart";
import CurrentPositions from "@/components/dashboard/current-positions";
import PortfolioDistribution from "@/components/dashboard/portfolio-distribution";
import SummaryStats from "@/components/dashboard/summary-stats";
import WeeklyReturnsChart from "@/components/dashboard/weekly-returns-chart";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/config";
import {
  accountValueOverTime,
  currentPositions,
  portfolioDistribution,
  portfolioSummary,
  weeklyPerformance,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // Get user session
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch all analytics data in parallel
  const [
    summaryData,
    positionsData,
    distributionData,
    weeklyData,
    accountValueData,
  ] = await Promise.all([
    db
      .select()
      .from(portfolioSummary)
      .where(eq(portfolioSummary.userId, userId))
      .limit(1),
    db
      .select()
      .from(currentPositions)
      .where(eq(currentPositions.userId, userId))
      .limit(50),
    db
      .select()
      .from(portfolioDistribution)
      .where(eq(portfolioDistribution.userId, userId))
      .limit(20),
    db
      .select()
      .from(weeklyPerformance)
      .where(eq(weeklyPerformance.userId, userId))
      .limit(12),
    db
      .select()
      .from(accountValueOverTime)
      .where(eq(accountValueOverTime.userId, userId))
      .limit(52),
  ]);

  // Provide default values if no data exists
  const summary = summaryData[0] || {
    portfolioValue: "0",
    cashBalance: "0",
    monthlyPnl: "0",
    yearlyPnl: "0",
    weeklyPnlAmount: "0",
    monthlyPnlPercent: "0",
    yearlyPnlPercent: "0",
    totalIncome: "0",
    totalFees: "0",
    uniqueTickers: "0",
    totalTransactions: "0",
    firstTransactionDate: null,
    lastTransactionDate: null,
  };

  return (
    <div className="p-6 space-y-6">
      <SummaryStats summary={summary} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <WeeklyReturnsChart weeklyData={weeklyData} />
        <AccountValueChart accountValueData={accountValueData} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CurrentPositions positions={positionsData} />
        <PortfolioDistribution distribution={distributionData} />
      </div>
    </div>
  );
}
