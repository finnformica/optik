import AccountValueChart from "@/components/dashboard/account-value-chart";
import CurrentPositions from "@/components/dashboard/current-positions";
import PortfolioDistribution from "@/components/dashboard/portfolio-distribution";
import ProfitDistribution from "@/components/dashboard/profit-distribution";
import SummaryStats from "@/components/dashboard/summary-stats";
import TradingActivityHeatmap from "@/components/dashboard/trading-activity-heatmap";
import WeeklyReturnsChart from "@/components/dashboard/weekly-returns-chart";
import { getDashboardData } from "./actions";

export default async function DashboardPage() {
  // Fetch all dashboard data in a single optimized call (includes getAccountKey)
  const {
    positions: positionsData,
    portfolioDistribution: distributionData,
    profitDistribution: profitDistributionData,
    portfolioSummary,
    weeklyReturns: weeklyReturnsData,
    dailyActivity: dailyActivityData,
  } = await getDashboardData();

  const availableCash = portfolioSummary?.availableCash || "0";

  return (
    <div className="space-y-6">
      <SummaryStats portfolioSummary={portfolioSummary} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <WeeklyReturnsChart weeklyData={weeklyReturnsData} />
        <AccountValueChart accountValueData={weeklyReturnsData} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CurrentPositions positions={positionsData} />
        <PortfolioDistribution
          distribution={distributionData}
          cashBalance={Number(availableCash)}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TradingActivityHeatmap dailyData={dailyActivityData} />
        <ProfitDistribution profitData={profitDistributionData} />
      </div>
    </div>
  );
}