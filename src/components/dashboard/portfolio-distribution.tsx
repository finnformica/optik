"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ViewPortfolioDistribution } from "@/lib/db/schema";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface PortfolioDistributionProps {
  distribution: ViewPortfolioDistribution[];
  cashBalance: number;
}

const CASH_COLOR = "#ff6b35";

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f59e0b",
  "#10b981",
];

// Function to get a distinct color for each index
const getColor = (index: number) => {
  if (index < COLORS.length) {
    return COLORS[index];
  }

  return COLORS[(index + 2) % COLORS.length];
};

const PortfolioDistribution = ({
  distribution,
  cashBalance,
}: PortfolioDistributionProps) => {
  const totalValue = distribution.reduce(
    (sum, item) => sum + parseFloat(item.positionValue || "0"),
    cashBalance
  );

  // Check if there's no data to display
  const hasNoData = distribution.length === 0 && cashBalance === 0;

  const data = [
    ...distribution,
    { symbol: "Cash", positionValue: cashBalance.toString() },
  ].map((item, index) => ({
    name: item.symbol,
    value: parseFloat(item.positionValue || "0"),
    fill: item.symbol === "Cash" ? CASH_COLOR : getColor(index),
  }));

  // Calculate positions for labels extending from the pie chart
  const renderCustomisedLabel = ({
    cx,
    cy,
    midAngle,
    outerRadius,
    index,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 20; // Extend labels outside the pie
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Calculate the percentage for this segment
    const value = data[index].value;
    const percentage =
      totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : "0";

    return (
      <g>
        {/* Line connecting segment to label */}
        <line
          x1={cx + (outerRadius + 5) * Math.cos(-midAngle * RADIAN)}
          y1={cy + (outerRadius + 5) * Math.sin(-midAngle * RADIAN)}
          x2={x - (x > cx ? 5 : -5)}
          y2={y}
          stroke="#6b7280"
          strokeWidth={1}
        />
        {/* Label text */}
        <text
          x={x}
          y={y}
          fill="white"
          textAnchor={x > cx ? "start" : "end"}
          dominantBaseline="central"
          className="text-xs font-medium"
        >
          {data[index].name} ({percentage}%)
        </text>
      </g>
    );
  };

  return (
    <Card className="bg-[#1a2236] border-gray-800 py-0 gap-0">
      <CardHeader className="border-b border-gray-800 p-4">
        <CardTitle className="text-white">Portfolio Distribution</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[300px] flex items-center justify-center">
          {hasNoData ? (
            <p className="text-gray-400">No portfolio data available</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={0}
                  stroke="none"
                  dataKey="value"
                  label={renderCustomisedLabel}
                  labelLine={false}
                >
                  {data.map((item, index) => (
                    <Cell key={`cell-${index}`} fill={item.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a2236",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value: number, name: string) => {
                    const percentage =
                      totalValue > 0
                        ? ((value / totalValue) * 100).toFixed(1)
                        : "0";

                    return [
                      <div key="tooltip-content">
                        <div className="font-medium text-white">{name}</div>
                        <div className="text-gray-300">
                          ${value.toLocaleString()} ({percentage}%)
                        </div>
                      </div>,
                      null,
                    ];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioDistribution;
