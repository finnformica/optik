"use client";

import { DashboardWidget } from "@/components/dashboard/dashboard-widget";
import { NoDataOverlay } from "@/components/dashboard/no-data-overlay";
import { ViewWeeklyReturn } from "@/lib/db/schema";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AccountValueChartProps {
  accountValueData: ViewWeeklyReturn[];
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
  });
};

const AccountValueChart = ({ accountValueData }: AccountValueChartProps) => {
  // Use the cumulative values calculated in the database view
  const chartData = accountValueData.map((item) => {
    const transfers = parseFloat(item.cumulativeTransfers || "0");
    const portfolioValue = parseFloat(item.cumulativePortfolioValue || "0");

    return {
      week: formatDate(item.weekStart || ""),
      "Account Value": Math.abs(portfolioValue),
      Transfers: Math.abs(transfers),
      date: item.weekStart,
    };
  }); // Data is already ordered by week_start ASC in the view

  // Mock data for empty state
  const emptyStateData = [
    { week: "Jan 1", "Account Value": 10000, Transfers: 10000 },
    { week: "Jan 8", "Account Value": 12500, Transfers: 10000 },
    { week: "Jan 15", "Account Value": 12500, Transfers: 10000 },
    { week: "Jan 22", "Account Value": 14200, Transfers: 10000 },
    { week: "Jan 29", "Account Value": 21500, Transfers: 15000 },
    { week: "Feb 5", "Account Value": 22000, Transfers: 15000 },
    { week: "Feb 12", "Account Value": 23900, Transfers: 15000 },
  ];
  return (
    <DashboardWidget title="Account Value" contentClassName="pt-6">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData.length === 0 ? emptyStateData : chartData}
          margin={{ top: 10, right: 30, left: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="week" stroke="#9CA3AF" fontSize={12} />
          <YAxis
            stroke="#9CA3AF"
            fontSize={12}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a2236",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#fff",
            }}
            formatter={(value: number, name: string) => [
              `$${value.toLocaleString()}`,
              name,
            ]}
          />
          <Legend
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{
              paddingTop: "12px",
              color: "#fff",
              fontSize: "12px",
            }}
          />
          <Line
            type="monotone"
            dataKey="Transfers"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{
              fill: "#fff",
              stroke: "#8b5cf6",
              strokeWidth: 2,
              r: 4,
            }}
            activeDot={{
              r: 5,
              stroke: "#8b5cf6",
              strokeWidth: 2,
              fill: "#fff",
            }}
          />
          <Line
            type="monotone"
            dataKey="Account Value"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{
              fill: "#fff",
              stroke: "#3b82f6",
              strokeWidth: 2,
              r: 4,
            }}
            activeDot={{
              r: 5,
              stroke: "#3b82f6",
              strokeWidth: 2,
              fill: "#fff",
            }}
          />
        </LineChart>
      </ResponsiveContainer>
      <NoDataOverlay show={chartData.length === 0} />
    </DashboardWidget>
  );
};

export default AccountValueChart;
