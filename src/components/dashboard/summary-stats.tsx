import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ViewPortfolioSummary } from "@/lib/db/schema";
import {
  Calendar,
  ChartNoAxesColumn,
  DollarSign,
  HelpCircle,
  LucideIcon,
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
  helpContent?: string;
}

interface SummaryStatsProps {
  portfolioSummary: ViewPortfolioSummary;
}

const SummaryStats = ({ portfolioSummary: summary }: SummaryStatsProps) => {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
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

  // Helper for cash balance
  const cashBalance = parseFloat(summary.availableCash || "0");
  const portfolioValue = parseFloat(summary.portfolioValue || "0");

  // Dynamic card configuration
  const summaryCards: SummaryCard[] = [
    {
      id: "portfolio-value",
      title: "Portfolio Value",
      icon: ChartNoAxesColumn,
      iconColor: "text-purple-500",
      value: (summary) =>
        formatCurrency(Math.abs(parseFloat(summary.portfolioValue || "0"))),
      showTrend: true,
      trendValue: () => parseFloat(summary.overallPercentIncrease || "0"),
      trendLabel: "overall",
    },
    {
      id: "cash-balance",
      title: "Cash Balance",
      icon: DollarSign,
      iconColor: "text-purple-500",
      value: (summary) =>
        formatCurrencyWithSign(parseFloat(summary.availableCash || "0")),
      subtitle: (summary) => {
        if (cashBalance < 0) {
          return "Borrowed funds from broker";
        }
        return portfolioValue !== 0
          ? `${((cashBalance / portfolioValue) * 100).toFixed(1)}% of portfolio`
          : "0% of portfolio";
      },
      subtitleColor: cashBalance < 0 ? "text-orange-400" : "text-blue-400",
      helpContent:
        "Cash balance may be negative when using margin or buying power provided by your broker",
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
    <Card className="border-gray-800 bg-[#1a2236] p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const trendValue = card.trendValue ? card.trendValue(summary) : 0;

          return (
            <div key={card.id} className="rounded-lg bg-[#14192a] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <h3 className="text-sm font-medium text-gray-400">
                    {card.title}
                  </h3>
                  {card.helpContent && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 cursor-help text-gray-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{card.helpContent}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <Icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <p className="mt-2 text-2xl font-bold text-white">
                {card.value(summary)}
              </p>
              {card.subtitle && (
                <div
                  className={`mt-2 flex items-center text-sm ${
                    card.subtitleColor || "text-gray-400"
                  }`}
                >
                  <span>{card.subtitle(summary)}</span>
                </div>
              )}
              {card.showTrend && card.trendValue && (
                <div
                  className={`mt-2 flex items-center text-sm ${
                    trendValue >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  <TrendingUp
                    className={`mr-1 h-4 w-4 ${
                      trendValue < 0 ? "rotate-180 transform" : ""
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
