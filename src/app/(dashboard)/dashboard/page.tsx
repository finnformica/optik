import AccountValueChart from "@/components/dashboard/account-value-chart";
import CurrentPositions from "@/components/dashboard/current-positions";
import PortfolioDistribution from "@/components/dashboard/portfolio-distribution";
import SummaryStats from "@/components/dashboard/summary-stats";
import WeeklyReturnsChart from "@/components/dashboard/weekly-returns-chart";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/config";
import { getPortfolioSummary } from "@/lib/db/etl/queries";
import { viewAccountReturns, viewPositions } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // Get user session
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch all analytics data in parallel
  const [positionsData, distributionData, accountValueData, portfolioSummary] =
    await Promise.all([
      db
        .select()
        .from(viewPositions)
        .where(
          and(
            eq(viewPositions.userId, userId),
            eq(viewPositions.isOpen, "true")
          )
        ),
      db
        .select({
          symbol: viewPositions.underlyingSymbol,
          positionValue: viewPositions.costBasis,
          instrumentCount: viewPositions.netQuantity,
        })
        .from(viewPositions)
        .where(
          and(
            eq(viewPositions.userId, userId),
            eq(viewPositions.isOpen, "true")
          )
        ),
      db
        .select()
        .from(viewAccountReturns)
        .where(eq(viewAccountReturns.userId, userId)),
      getPortfolioSummary(userId),
    ]);

  return (
    <div className="space-y-6">
      <SummaryStats summary={portfolioSummary} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <WeeklyReturnsChart weeklyData={accountValueData} />
        <AccountValueChart accountValueData={accountValueData} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CurrentPositions positions={positionsData} />
        <PortfolioDistribution
          distribution={distributionData}
          cashBalance={portfolioSummary.cashBalance}
        />
      </div>
    </div>
  );
}
