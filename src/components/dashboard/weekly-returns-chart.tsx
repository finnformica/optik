"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklyPerformance } from "@/lib/db/schema";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface WeeklyReturnsChartProps {
  weeklyData: WeeklyPerformance[];
}

const WeeklyReturnsChart = ({ weeklyData }: WeeklyReturnsChartProps) => {
  // Sort data by date to ensure proper chronological order
  const sortedData = [...weeklyData].sort(
    (a, b) =>
      new Date(a.weekStart || "").getTime() -
      new Date(b.weekStart || "").getTime()
  );

  // Calculate cumulative portfolio value to determine percentage returns
  let cumulativeValue = 0;

  // Format data for chart, calculating running portfolio value
  const chartData = sortedData.map((item, index) => {
    const absoluteReturns = parseFloat(item.weeklyPnl || "0");

    // For the first week, assume a base portfolio value or use the absolute returns as base
    if (index === 0 && cumulativeValue === 0) {
      cumulativeValue =
        Math.abs(absoluteReturns) > 1000
          ? Math.abs(absoluteReturns) * 10
          : 10000;
    }

    const percentReturns =
      cumulativeValue > 0 ? (absoluteReturns / cumulativeValue) * 100 : 0;
    cumulativeValue += absoluteReturns; // Update running total for next week

    return {
      week: new Date(item.weekStart || "").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      absoluteReturns,
      percentReturns,
      date: item.weekStart,
    };
  });
  return (
    <Card className="bg-[#1a2236] border-gray-800 pt-0">
      <CardHeader className="border-b border-gray-800 p-4">
        <CardTitle className="text-white">Weekly Returns</CardTitle>
      </CardHeader>
      <CardContent className="px-2">
        <div className="h-[300px]">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                No weekly data available
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="week" stroke="#9CA3AF" fontSize={12} />
                <YAxis
                  yAxisId="absolute"
                  orientation="left"
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={(value) => `$${value}`}
                />
                <YAxis
                  yAxisId="percent"
                  orientation="right"
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a2236",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "absoluteReturns") {
                      return [`$${value.toLocaleString()}`, "Absolute Returns"];
                    }
                    return [`${value.toFixed(2)}%`, "Percent Returns"];
                  }}
                />
                <Bar
                  yAxisId="absolute"
                  dataKey="absoluteReturns"
                  fill="#3b82f6"
                  radius={[2, 2, 0, 0]}
                  opacity={0.8}
                />
                <Line
                  yAxisId="percent"
                  type="monotone"
                  dataKey="percentReturns"
                  stroke="#FFF"
                  strokeWidth={2}
                  dot={{ fill: "#FFF", strokeWidth: 2, r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyReturnsChart;
