"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ViewWeeklyReturn } from "@/lib/db/schema";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface WeeklyReturnsChartProps {
  weeklyData: ViewWeeklyReturn[];
}

const WeeklyReturnsChart = ({ weeklyData }: WeeklyReturnsChartProps) => {
  // Sort data by date to ensure proper chronological order
  const sortedData = [...weeklyData].sort(
    (a, b) =>
      new Date(a.weekStart || "").getTime() -
      new Date(b.weekStart || "").getTime()
  );

  // Format data for chart
  const chartData = sortedData.map((item) => {
    const absoluteReturns = parseFloat(item.weeklyReturnAbsolute || "0");
    const percentReturns = parseFloat(item.weeklyReturnPercent || "0");

    return {
      week: new Date(item.weekStart || "").toLocaleDateString("en-GB", {
        month: "short",
        day: "numeric",
      }),
      absoluteReturns,
      percentReturns,
      date: item.weekStart,
    };
  });

  return (
    <Card className="bg-[#1a2236] border-gray-800 py-0">
      <CardHeader className="border-b border-gray-800 p-4">
        <CardTitle className="text-white">Weekly Returns</CardTitle>
      </CardHeader>
      <CardContent className="px-2 py-0">
        <div className="h-[300px]">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                No weekly data available
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="week" stroke="#9CA3AF" fontSize={12} />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                />
                <Tooltip
                  cursor={{ fill: "#0f172a", opacity: 0.5 }}
                  contentStyle={{
                    backgroundColor: "#1a2236",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value: number, _: string, props: any) => {
                    const absoluteValue = props.payload.absoluteReturns;
                    return [
                      `${value.toFixed(
                        2
                      )}% ($${absoluteValue.toLocaleString()})`,
                      "Weekly Return",
                    ];
                  }}
                />
                <Bar
                  dataKey="percentReturns"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  opacity={1}
                >
                  <LabelList
                    dataKey="percentReturns"
                    position="top"
                    style={{ fill: "#fff", fontSize: "12px" }}
                    formatter={(value: unknown) =>
                      `${parseFloat(value as string).toFixed(2)}%`
                    }
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyReturnsChart;
