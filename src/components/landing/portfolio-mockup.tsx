"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";

const mockAccountValueData = [
  { date: "Jul 21", value: 9000, transfers: 0 },
  { date: "Jul 28", value: 9500, transfers: 0 },
  { date: "Aug 4", value: 10200, transfers: 0 },
  { date: "Aug 11", value: 11500, transfers: 1000 },
  { date: "Aug 18", value: 13200, transfers: 0 },
  { date: "Aug 25", value: 14800, transfers: 0 },
  { date: "Sep 1", value: 15100, transfers: 0 },
  { date: "Sep 8", value: 16200, transfers: 0 },
  { date: "Sep 15", value: 16800, transfers: 0 },
  { date: "Sep 22", value: 17174, transfers: 0 },
];

const mockPortfolioData = [
  { name: "BAX", value: 22.8, fill: "#3b82f6" },
  { name: "BSWI", value: 24.9, fill: "#8b5cf6" },
  { name: "GRPN", value: 11.4, fill: "#f59e0b" },
  { name: "GEO", value: 19.9, fill: "#10b981" },
  { name: "RUM", value: 20.9, fill: "#ec4899" },
];

const mockTransactions = [
  { merchant: "iCloud Monthly", category: "Premium", date: "08 Dec 2024", amount: "-$4.99" },
  { merchant: "Netflix", category: "Shopping", date: "07 Dec 2024", amount: "-$15.99" },
  { merchant: "Spotify Premium", category: "Entertainment", date: "06 Dec 2024", amount: "-$9.99" },
];

// Function to render custom labels for pie chart
const renderCustomisedLabel = ({ cx, cy, midAngle, outerRadius, index, data }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 15;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  const percentage = ((data[index].value / 100) * 100).toFixed(1);

  return (
    <g>
      <line
        x1={cx + (outerRadius + 5) * Math.cos(-midAngle * RADIAN)}
        y1={cy + (outerRadius + 5) * Math.sin(-midAngle * RADIAN)}
        x2={x - (x > cx ? 5 : -5)}
        y2={y}
        stroke="#6b7280"
        strokeWidth={1}
      />
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

export function PortfolioMockup() {
  return (
    <div className="space-y-6">
      {/* Account Value Chart */}
      <Card className="border-border/50 shadow-xl shadow-primary/5 bg-card/90 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Account Value</CardTitle>
            <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
              +15.2%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockAccountValueData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  fontSize={10}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={10}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a2332",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Account Value"]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 4, fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Distribution */}
      <Card className="border-border/50 shadow-xl shadow-primary/5 bg-card/90 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Portfolio Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockPortfolioData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={0}
                  dataKey="value"
                  label={(props) => renderCustomisedLabel({ ...props, data: mockPortfolioData })}
                  labelLine={false}
                >
                  {mockPortfolioData.map((item, index) => (
                    <Cell key={`cell-${index}`} fill={item.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a2332",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(value: number, name: string) => [
                    <div key="tooltip-content">
                      <div className="font-medium text-white">{name}</div>
                      <div className="text-gray-300">{value.toFixed(1)}%</div>
                    </div>,
                    null,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="border-border/50 shadow-xl shadow-primary/5 bg-card/90 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockTransactions.map((transaction, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
                <div className="flex-1">
                  <p className="font-medium text-sm">{transaction.merchant}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-xs px-2 py-0">
                      {transaction.category}
                    </Badge>
                    <span>{transaction.date}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm text-red-400">{transaction.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}