"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountValueOverTime } from "@/lib/db/schema";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AccountValueChartProps {
  accountValueData: AccountValueOverTime[];
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
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
      transfers: Math.abs(transfers),
      portfolioValue: Math.abs(portfolioValue),
      date: item.weekStart,
    };
  }); // Data is already ordered by week_start ASC in the view
  return (
    <Card className="bg-[#1a2236] border-gray-800">
      <CardHeader className="border-b border-gray-800">
        <CardTitle className="text-white">Account Value Over Time</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[300px]">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                No account history available
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
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
                    name === "transfers" ? "Transfers" : "Portfolio",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="transfers"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 3 }}
                  activeDot={{
                    r: 5,
                    stroke: "#8b5cf6",
                    strokeWidth: 2,
                    fill: "#1a2236",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="portfolioValue"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                  activeDot={{
                    r: 6,
                    stroke: "#3b82f6",
                    strokeWidth: 2,
                    fill: "#1a2236",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountValueChart;
