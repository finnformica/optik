"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  {
    name: "AAPL",
    value: 2500,
    days: 15,
  },
  {
    name: "MSFT",
    value: 1800,
    days: 10,
  },
  {
    name: "TSLA",
    value: 1200,
    days: 5,
  },
  {
    name: "NVDA",
    value: 3000,
    days: 20,
  },
  {
    name: "AMZN",
    value: 2100,
    days: 8,
  },
];

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

const PortfolioDistribution = () => {
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="bg-[#1a2236] border-gray-800">
      <CardHeader className="border-b border-gray-800">
        <CardTitle className="text-white">Portfolio Distribution</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 mb-4">
              Chart visualization would go here
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {data.map((item, index) => {
                const percentage = ((item.value / totalValue) * 100).toFixed(0);
                return (
                  <div
                    key={index}
                    className="flex justify-between items-center p-2 bg-[#14192a] rounded"
                  >
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="text-white">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-300">
                        ${item.value.toLocaleString()}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {percentage}% • {item.days} days
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioDistribution;
