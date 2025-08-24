"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortfolioDistribution as PortfolioDistributionType } from "@/lib/db/schema";
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

interface PortfolioDistributionProps {
  distribution: PortfolioDistributionType[];
}

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

const PortfolioDistribution = ({ distribution }: PortfolioDistributionProps) => {
  const totalValue = distribution.reduce((sum, item) => sum + parseFloat(item.positionValue || '0'), 0);

  return (
    <Card className="bg-[#1a2236] border-gray-800">
      <CardHeader className="border-b border-gray-800">
        <CardTitle className="text-white">Portfolio Distribution</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[300px] flex">
          {distribution.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                No positions to display
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 flex items-center justify-center">
                <PieChart width={250} height={250}>
                  <Pie
                    data={distribution.map((item, index) => ({
                      name: item.ticker,
                      value: parseFloat(item.positionValue || '0'),
                      fill: COLORS[index % COLORS.length],
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {distribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a2236',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                  />
                </PieChart>
              </div>
              <div className="flex-1 space-y-2 max-h-[250px] overflow-y-auto pr-2">
                {distribution.map((item, index) => {
                  const value = parseFloat(item.positionValue || '0');
                  const percentage = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0';
                  return (
                    <div
                      key={`${item.ticker}-${index}`}
                      className="flex justify-between items-center p-2 bg-[#14192a] rounded"
                    >
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span className="text-white text-sm">{item.ticker}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-300 text-sm">
                          ${value.toLocaleString()}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {percentage}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioDistribution;
