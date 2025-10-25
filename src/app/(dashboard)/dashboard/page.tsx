"use client";

import AccountValueChart from "@/components/dashboard/account-value-chart";
import CurrentPositions from "@/components/dashboard/current-positions";
import PortfolioDistribution from "@/components/dashboard/portfolio-distribution";
import ProfitDistribution from "@/components/dashboard/profit-distribution";
import SummaryStats from "@/components/dashboard/summary-stats";
import TradingActivityHeatmap from "@/components/dashboard/trading-activity-heatmap";
import WeeklyReturnsChart from "@/components/dashboard/weekly-returns-chart";
import {
  usePortfolioSummary,
  useWeeklyReturns,
  useCurrentPositions,
  usePortfolioDistribution,
  useProfitDistribution,
  useDailyActivity,
} from "@/api/dashboard";

export default function DashboardPage() {
  const { portfolioSummary, isLoading: portfolioSummaryLoading } = usePortfolioSummary();
  const { weeklyReturns, isLoading: weeklyReturnsLoading } = useWeeklyReturns();
  const { positions, isLoading: positionsLoading } = useCurrentPositions();
  const { portfolioDistribution, isLoading: portfolioDistributionLoading } = usePortfolioDistribution();
  const { profitDistribution, isLoading: profitDistributionLoading } = useProfitDistribution();
  const { dailyActivity, isLoading: dailyActivityLoading } = useDailyActivity();

  const availableCash = portfolioSummary?.availableCash || "0";

  return (
    <div className="space-y-3 md:space-y-6">
      <div data-tour="summary-stats">
        <SummaryStats portfolioSummary={portfolioSummary} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:gap-6 xl:grid-cols-2">
        <WeeklyReturnsChart weeklyData={weeklyReturns} isLoading={weeklyReturnsLoading} />
        <AccountValueChart accountValueData={weeklyReturns} isLoading={weeklyReturnsLoading} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:gap-6 xl:grid-cols-2">
        <CurrentPositions positions={positions} showPrices isLoading={positionsLoading} />
        <PortfolioDistribution
          distribution={portfolioDistribution}
          cashBalance={Number(availableCash)}
          isLoading={portfolioDistributionLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:gap-6 xl:grid-cols-2">
        <TradingActivityHeatmap dailyData={dailyActivity} isLoading={dailyActivityLoading} />
        <ProfitDistribution profitData={profitDistribution} isLoading={profitDistributionLoading} />
      </div>
    </div>
  );
}
