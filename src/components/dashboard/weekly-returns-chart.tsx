"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  {
    week: "Week 1",
    returns: 1250,
    percent: 2.3,
  },
  {
    week: "Week 2",
    returns: -450,
    percent: -0.8,
  },
  {
    week: "Week 3",
    returns: 2100,
    percent: 3.7,
  },
  {
    week: "Week 4",
    returns: 1650,
    percent: 2.8,
  },
  {
    week: "Week 5",
    returns: -850,
    percent: -1.4,
  },
  {
    week: "Week 6",
    returns: 1400,
    percent: 2.4,
  },
];

const WeeklyReturnsChart = () => {
  return (
    <Card className="bg-[#1a2236] border-gray-800">
      <CardHeader className="border-b border-gray-800">
        <CardTitle className="text-white">Weekly Returns</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 mb-4">
              Chart visualization would go here
            </p>
            <div className="space-y-2">
              {data.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-2 bg-[#14192a] rounded"
                >
                  <span className="text-white">{item.week}</span>
                  <span
                    className={`font-medium ${
                      item.returns >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    ${item.returns.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyReturnsChart;
