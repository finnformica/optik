"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  return (
    <Card className="bg-[#1a2236] border-gray-800 py-0">
      <CardHeader className="border-b border-gray-800 p-4">
        <CardTitle className="text-white">Account Value</CardTitle>
      </CardHeader>
      <CardContent className="px-2">
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
                margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
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
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountValueChart;
