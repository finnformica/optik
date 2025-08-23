import AccountValueChart from "@/components/dashboard/account-value-chart";
import CurrentPositions from "@/components/dashboard/current-positions";
import PortfolioDistribution from "@/components/dashboard/portfolio-distribution";
import SummaryStats from "@/components/dashboard/summary-stats";
import WeeklyReturnsChart from "@/components/dashboard/weekly-returns-chart";

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>

      <SummaryStats />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <WeeklyReturnsChart />
        <AccountValueChart />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CurrentPositions />
        <PortfolioDistribution />
      </div>
    </div>
  );
}
