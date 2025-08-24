import { Card } from "@/components/ui/card";
import { PortfolioSummary } from "@/lib/db/schema";
import { Calendar, DollarSign, Percent, TrendingUp } from "lucide-react";

interface SummaryStatsProps {
  summary: PortfolioSummary;
}

const SummaryStats = ({ summary }: SummaryStatsProps) => {
  // Portfolio value is total account value (transfers + gains/losses + dividends + interest)
  const portfolioValue = parseFloat(summary.portfolioValue || "0");
  // Cash balance is now portfolio value minus positions (available cash)
  const cashBalance = parseFloat(summary.cashBalance || "0");
  const monthlyPnl = parseFloat(summary.monthlyPnl || "0");
  const yearlyPnl = parseFloat(summary.yearlyPnl || "0");
  const weeklyPnlAmount = parseFloat(summary.weeklyPnlAmount || "0");
  const monthlyPnlPercent = parseFloat(summary.monthlyPnlPercent || "0");
  const yearlyPnlPercent = parseFloat(summary.yearlyPnlPercent || "0");

  // Calculate weekly percentage based on the amount vs portfolio
  const weeklyPnlPercent =
    portfolioValue > 0 ? (weeklyPnlAmount / portfolioValue) * 100 : 0;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };
  return (
    <Card className="bg-[#1a2236] border-gray-800 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#14192a] p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400 text-sm font-medium">
              Portfolio Value
            </h3>
            <DollarSign className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-white text-2xl font-bold mt-2">
            {formatCurrency(Math.abs(portfolioValue))}
          </p>
          <div
            className={`flex items-center mt-2 text-sm ${
              weeklyPnlPercent >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            <TrendingUp
              className={`h-4 w-4 mr-1 ${
                weeklyPnlPercent < 0 ? "transform rotate-180" : ""
              }`}
            />
            <span>{formatPercentage(weeklyPnlPercent)} this week</span>
          </div>
        </div>
        <div className="bg-[#14192a] p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400 text-sm font-medium">Monthly P/L</h3>
            <Calendar className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold mt-2">
            {formatCurrency(monthlyPnl)}
          </p>
          <div
            className={`flex items-center mt-2 text-sm ${
              monthlyPnlPercent >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            <TrendingUp
              className={`h-4 w-4 mr-1 ${
                monthlyPnlPercent < 0 ? "transform rotate-180" : ""
              }`}
            />
            <span>{formatPercentage(monthlyPnlPercent)} this month</span>
          </div>
        </div>
        <div className="bg-[#14192a] p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400 text-sm font-medium">Yearly P/L</h3>
            <Calendar className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{formatCurrency(yearlyPnl)}</p>
          <div
            className={`flex items-center mt-2 text-sm ${
              yearlyPnlPercent >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            <TrendingUp
              className={`h-4 w-4 mr-1 ${
                yearlyPnlPercent < 0 ? "transform rotate-180" : ""
              }`}
            />
            <span>{formatPercentage(yearlyPnlPercent)} this year</span>
          </div>
        </div>
        <div className="bg-[#14192a] p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400 text-sm font-medium">Cash Balance</h3>
            <Percent className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-white text-2xl font-bold mt-2">
            {formatCurrency(cashBalance)}
          </p>
          <div className="flex items-center mt-2 text-blue-400 text-sm">
            <span>
              {portfolioValue !== 0
                ? ((cashBalance / portfolioValue) * 100).toFixed(1)
                : "0"}
              % of portfolio
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SummaryStats;
