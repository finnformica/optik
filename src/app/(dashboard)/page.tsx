import AccountValueChart from "@/components/dashboard/account-value-chart";
import CurrentPositions from "@/components/dashboard/current-positions";
import PortfolioDistribution from "@/components/dashboard/portfolio-distribution";
import SummaryStats from "@/components/dashboard/summary-stats";
import WeeklyReturnsChart from "@/components/dashboard/weekly-returns-chart";

const Dashboard = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <SummaryStats />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <WeeklyReturnsChart />
        <AccountValueChart />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CurrentPositions />
        <PortfolioDistribution />
      </div>
      <div className="text-gray-500 text-xs text-center mt-6">
        Last Updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
};

export default Dashboard;
