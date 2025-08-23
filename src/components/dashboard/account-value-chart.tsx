"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  {
    date: "2023-06-01",
    accountValue: 10000,
    contributions: 10000,
  },
  {
    date: "2023-07-01",
    accountValue: 10450,
    contributions: 10000,
  },
  {
    date: "2023-08-01",
    accountValue: 10900,
    contributions: 10500,
  },
  {
    date: "2023-09-01",
    accountValue: 11250,
    contributions: 10500,
  },
  {
    date: "2023-10-01",
    accountValue: 12100,
    contributions: 11000,
  },
  {
    date: "2023-11-01",
    accountValue: 12850,
    contributions: 11000,
  },
  {
    date: "2023-12-01",
    accountValue: 13500,
    contributions: 11500,
  },
];

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
  });
};

const AccountValueChart = () => {
  return (
    <Card className="bg-[#1a2236] border-gray-800">
      <CardHeader className="border-b border-gray-800">
        <CardTitle className="text-white">Account Value Over Time</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 mb-4">
              Chart visualization would go here
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {data.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-2 bg-[#14192a] rounded"
                >
                  <span className="text-white">{formatDate(item.date)}</span>
                  <div className="text-right">
                    <div className="text-blue-400">
                      ${item.accountValue.toLocaleString()}
                    </div>
                    <div className="text-purple-400 text-sm">
                      ${item.contributions.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountValueChart;
