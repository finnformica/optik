"use client";

import { DashboardWidget } from "@/components/dashboard/dashboard-widget";
import { NoDataOverlay } from "@/components/dashboard/no-data-overlay";
import { ViewWeeklyReturn } from "@/lib/db/schema";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ReferenceLine,
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
      new Date(b.weekStart || "").getTime(),
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

  // Mock data for empty state
  const emptyStateData = [
    { week: "Jan 1", percentReturns: 8.5, absoluteReturns: 850 },
    { week: "Jan 8", percentReturns: 25.0, absoluteReturns: 2500 },
    { week: "Jan 15", percentReturns: -5.6, absoluteReturns: -700 },
    { week: "Jan 22", percentReturns: 20.3, absoluteReturns: 2400 },
    { week: "Jan 29", percentReturns: 16.2, absoluteReturns: 2300 },
    { week: "Feb 5", percentReturns: -4.2, absoluteReturns: -700 },
    { week: "Feb 12", percentReturns: 19.6, absoluteReturns: 3100 },
  ];

  const hasNoData = chartData.length === 0;
  const data = hasNoData ? emptyStateData : chartData;
  const average = (
    data.reduce((total, next) => total + next.percentReturns, 0) / data.length
  ).toFixed(1);

  return (
    <DashboardWidget title="Weekly Returns" contentClassName="pt-6">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 40 }}>
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
                `${value.toFixed(2)}% ($${absoluteValue.toLocaleString()})`,
                "Weekly Return",
              ];
            }}
          />
          <ReferenceLine
            y={average}
            strokeDasharray="8 4"
            stroke="#6B7280"
            strokeOpacity={0.7}
            strokeWidth={2}
          />
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{
              paddingTop: "12px",
              fontSize: "12px",
              color: "#9CA3AF",
            }}
            formatter={(value, _) => (
              <span style={{ color: "#9CA3AF" }}>{value}</span>
            )}
            content={(props) => {
              return (
                <div className="flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-xs bg-blue-400/90" />
                    <span className="text-xs text-gray-400">
                      Percent Returns
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-px w-6 border-t-2 border-dashed border-gray-500" />
                    <span className="text-xs text-gray-400">
                      Average Returns ({average}%)
                    </span>
                  </div>
                </div>
              );
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
      <NoDataOverlay show={hasNoData} />
    </DashboardWidget>
  );
};

export default WeeklyReturnsChart;
