import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";

// Helper function to calculate days until expiry
const calculateDaysUntilExpiry = (expiryDate: string) => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = Math.abs(expiry.getTime() - today.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const positions = [
  {
    id: 1,
    symbol: "AAPL",
    type: "Call",
    strike: 190,
    expiry: "2023-12-15",
    currentPrice: 195.42,
    status: "ITM",
    profit: 325.5,
  },
  {
    id: 2,
    symbol: "MSFT",
    type: "Put",
    strike: 350,
    expiry: "2023-12-22",
    currentPrice: 345.78,
    status: "ITM",
    profit: 210.25,
  },
  {
    id: 3,
    symbol: "TSLA",
    type: "Call",
    strike: 240,
    expiry: "2023-12-29",
    currentPrice: 235.12,
    status: "OTM",
    profit: -125.75,
  },
  {
    id: 4,
    symbol: "NVDA",
    type: "Call",
    strike: 480,
    expiry: "2024-01-19",
    currentPrice: 495.36,
    status: "ITM",
    profit: 450.2,
  },
];

const CurrentPositions = () => {
  return (
    <Card className="bg-[#1a2236] border-gray-800">
      <CardHeader className="border-b border-gray-800">
        <CardTitle className="text-white">Current Positions</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Symbol
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Strike
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Expiry
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Days Left
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Current
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  P/L
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {positions.map((position) => {
                const daysLeft = calculateDaysUntilExpiry(position.expiry);
                return (
                  <tr key={position.id}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-white">
                      {position.symbol}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                      {position.type}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                      ${position.strike}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                      {position.expiry}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                      {daysLeft}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                      ${position.currentPrice}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          position.status === "ITM"
                            ? "bg-green-900/30 text-green-400"
                            : "bg-red-900/30 text-red-400"
                        }`}
                      >
                        {position.status}
                      </span>
                    </td>
                    <td
                      className={`px-3 py-2 whitespace-nowrap text-sm font-medium flex items-center ${
                        position.profit >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {position.profit >= 0 ? (
                        <ArrowUp className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDown className="h-3 w-3 mr-1" />
                      )}
                      ${Math.abs(position.profit).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentPositions;
