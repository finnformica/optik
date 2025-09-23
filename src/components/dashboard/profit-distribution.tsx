"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ViewProfitDistribution } from "@/lib/db/schema";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface ProfitDistributionProps {
  profitData: ViewProfitDistribution[];
}

const OTHERS_COLOR = "#ff6b35";

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f59e0b",
  "#10b981",
];

// Function to get a distinct color for each index, with green/red for profit/loss
const getColor = (index: number) => {
  if (index < COLORS.length) {
    return COLORS[index];
  }
  return COLORS[(index + 2) % COLORS.length];
};

const ProfitDistribution = ({ profitData }: ProfitDistributionProps) => {
  // Calculate total absolute profit to get percentages
  const totalAbsoluteProfit = profitData.reduce(
    (sum, item) => sum + Math.abs(parseFloat(item.totalProfit || "0")),
    0
  );

  // Check if there's no data to display
  const hasNoData = profitData.length === 0 || totalAbsoluteProfit === 0;

  // Process data and group small slices
  const processedData = (() => {
    const MIN_PERCENTAGE = 3; // Group anything smaller than 3%
    const MAX_INDIVIDUAL_ITEMS = 10; // Show max 10 individual items

    const sortedData = profitData
      .map((item) => {
        const profit = parseFloat(item.totalProfit || "0");
        return {
          name: item.underlyingSymbol,
          value: Math.abs(profit),
          originalValue: profit,
          trades: item.tradeCount,
          isProfit: profit > 0,
          percentage:
            totalAbsoluteProfit > 0
              ? (Math.abs(profit) / totalAbsoluteProfit) * 100
              : 0,
        };
      })
      .sort((a, b) => b.value - a.value); // Sort by absolute value desc

    // Split into main items and others
    const mainItems: typeof sortedData = [];
    const otherItems: typeof sortedData = [];

    sortedData.forEach((item, index) => {
      if (index < MAX_INDIVIDUAL_ITEMS && item.percentage >= MIN_PERCENTAGE) {
        mainItems.push(item);
      } else {
        otherItems.push(item);
      }
    });

    // Create "Others" category if we have small items
    const finalData = [...mainItems];

    if (otherItems.length > 0) {
      const othersValue = otherItems.reduce((sum, item) => sum + item.value, 0);
      const othersOriginalValue = otherItems.reduce(
        (sum, item) => sum + item.originalValue,
        0
      );
      const othersTrades = otherItems.reduce(
        (sum, item) => sum + (item.trades ?? 0),
        0
      );

      finalData.push({
        name: `Others (${otherItems.length})`,
        value: othersValue,
        originalValue: othersOriginalValue,
        trades: othersTrades,
        isProfit: othersOriginalValue > 0,
        percentage:
          totalAbsoluteProfit > 0
            ? (othersValue / totalAbsoluteProfit) * 100
            : 0,
      });
    }

    return finalData;
  })();

  const data = processedData.map((item, index) => ({
    ...item,
    fill: item.name?.startsWith("Others") ? OTHERS_COLOR : getColor(index),
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
    const radius = outerRadius + 20;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const value = data[index]?.value ?? 0;
    const percentage =
      totalAbsoluteProfit > 0
        ? ((value / totalAbsoluteProfit) * 100).toFixed(1)
        : "0";

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
        <CardTitle className="text-white">Profit Distribution</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[300px] flex items-center justify-center">
          {hasNoData ? (
            <p className="text-gray-400">No profit/loss data available</p>
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
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
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
                    const dataPoint = data.find((d) => d.name === name);
                    const percentage =
                      totalAbsoluteProfit > 0
                        ? ((value / totalAbsoluteProfit) * 100).toFixed(1)
                        : "0";

                    const isProfit = dataPoint?.isProfit ?? false;
                    const originalValue = dataPoint?.originalValue ?? 0;
                    const trades = dataPoint?.trades ?? 0;

                    return [
                      <div key="tooltip-content">
                        <div className="font-medium text-white">{name}</div>
                        <div
                          className={`text-sm ${
                            isProfit ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {isProfit ? "+" : ""}${originalValue.toLocaleString()}{" "}
                          ({percentage}%)
                        </div>
                        <div className="text-gray-300 text-xs">
                          {trades} trade{trades !== 1 ? "s" : ""}
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

export default ProfitDistribution;
