import { Card } from "@/components/ui/card";
import { getUserId } from "@/lib/auth/session";
import { db } from "@/lib/db/config";
import { viewPortfolioSummary, ViewPortfolioSummary } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  Calendar,
  DollarSign,
  LucideIcon,
  Percent,
  TrendingUp,
} from "lucide-react";

interface SummaryCard {
  id: string;
  title: string;
  icon: LucideIcon;
  iconColor: string;
  value: (summary: ViewPortfolioSummary) => string;
  subtitle?: (summary: ViewPortfolioSummary) => string;
  subtitleColor?: string;
  showTrend?: boolean;
  trendValue?: (summary: ViewPortfolioSummary) => number;
  trendLabel?: string;
}

export async function getSummary(userId: number) {
  const [row] = await db
    .select()
    .from(viewPortfolioSummary)
    .where(eq(viewPortfolioSummary.userId, userId))
    .limit(1);

  return row;
}

const SummaryStats = async () => {
  const userId = await getUserId();

  if (!userId) return null;

  const summary = await getSummary(userId);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format currency with sign for P/L
  const formatCurrencyWithSign = (amount: number) => {
    if (amount === 0) {
      return formatCurrency(amount);
    }

    const sign = amount > 0 ? "+" : "-";
    return `${sign}${formatCurrency(amount)}`;
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  // Dynamic card configuration
  const summaryCards: SummaryCard[] = [
    {
      id: "portfolio-value",
      title: "Portfolio Value",
      icon: DollarSign,
      iconColor: "text-purple-500",
      value: (summary) =>
        formatCurrency(Math.abs(parseFloat(summary.portfolioValue || "0"))),
      showTrend: true,
      trendValue: () => parseFloat(summary.weeklyPnlPercent || "0"),
      trendLabel: "this week",
    },
    {
      id: "cash-balance",
      title: "Cash Balance",
      icon: Percent,
      iconColor: "text-purple-500",
      value: (summary) =>
        formatCurrency(parseFloat(summary.cashBalance || "0")),
      subtitle: (summary) => {
        const portfolioValue = parseFloat(summary.portfolioValue || "0");
        const cashBalance = parseFloat(summary.cashBalance || "0");
        return portfolioValue !== 0
          ? `${((cashBalance / portfolioValue) * 100).toFixed(1)}% of portfolio`
          : "0% of portfolio";
      },
      subtitleColor: "text-blue-400",
    },
    {
      id: "monthly-pnl",
      title: "Monthly P/L",
      icon: Calendar,
      iconColor: "text-yellow-500",
      value: (summary) =>
        formatCurrencyWithSign(parseFloat(summary.monthlyPnl || "0")),
      showTrend: true,
      trendValue: () => parseFloat(summary.monthlyPnlPercent || "0"),
      trendLabel: "this month",
    },
    {
      id: "yearly-pnl",
      title: "Yearly P/L",
      icon: Calendar,
      iconColor: "text-yellow-500",
      value: (summary) =>
        formatCurrencyWithSign(parseFloat(summary.yearlyPnl || "0")),
      showTrend: true,
      trendValue: () => parseFloat(summary.yearlyPnlPercent || "0"),
      trendLabel: "this year",
    },
  ];

  return (
    <Card className="bg-[#1a2236] border-gray-800 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const trendValue = card.trendValue ? card.trendValue(summary) : 0;

          return (
            <div key={card.id} className="bg-[#14192a] p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-400 text-sm font-medium">
                  {card.title}
                </h3>
                <Icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <p className="text-white text-2xl font-bold mt-2">
                {card.value(summary)}
              </p>
              {card.subtitle && (
                <div
                  className={`flex items-center mt-2 text-sm ${
                    card.subtitleColor || "text-gray-400"
                  }`}
                >
                  <span>{card.subtitle(summary)}</span>
                </div>
              )}
              {card.showTrend && card.trendValue && (
                <div
                  className={`flex items-center mt-2 text-sm ${
                    trendValue >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  <TrendingUp
                    className={`h-4 w-4 mr-1 ${
                      trendValue < 0 ? "transform rotate-180" : ""
                    }`}
                  />
                  <span>
                    {formatPercentage(trendValue)} {card.trendLabel}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default SummaryStats;
