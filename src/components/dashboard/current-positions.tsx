import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrentPosition } from "@/lib/db/schema";
import { ArrowDown, ArrowUp } from "lucide-react";

interface CurrentPositionsProps {
  positions: CurrentPosition[];
}

// Helper function to calculate days until expiry
const calculateDaysUntilExpiry = (expiryDate: string | null) => {
  if (!expiryDate) return null;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const CurrentPositions = ({ positions }: CurrentPositionsProps) => {
  return (
    <Card className="bg-[#1a2236] border-gray-800 pt-0">
      <CardHeader className="border-b border-gray-800 p-4">
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
              {positions.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-8 text-center text-gray-400"
                  >
                    No open positions found
                  </td>
                </tr>
              ) : (
                positions.map((position, index) => {
                  const daysLeft = calculateDaysUntilExpiry(
                    position.expiryDate
                  );
                  const costBasis = parseFloat(position.costBasis || "0");
                  const isExpired = daysLeft !== null && daysLeft < 0;

                  // For expired options, if we still have a position, it means we collected premium (profit)
                  // For non-expired positions, negative cost basis means profit (we received more than we paid)
                  const isProfit = isExpired ? true : costBasis <= 0;

                  return (
                    <tr
                      key={`${position.ticker}-${position.optionType}-${position.strikePrice}-${index}`}
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-white">
                        {position.ticker}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                        {position.optionType || "Stock"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                        {position.strikePrice
                          ? `$${position.strikePrice}`
                          : "-"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                        {position.expiryDate || "-"}
                      </td>
                      <td
                        className={`px-3 py-2 whitespace-nowrap text-sm ${
                          isExpired ? "text-red-400" : "text-gray-300"
                        }`}
                      >
                        {daysLeft !== null
                          ? isExpired
                            ? "EXPIRED"
                            : daysLeft
                          : "-"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                        Qty: {parseFloat(position.netQuantity || "0")}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400">
                          {position.positionType}
                        </span>
                      </td>
                      <td
                        className={`px-3 py-2 whitespace-nowrap text-sm font-medium flex items-center ${
                          isProfit ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {isProfit ? (
                          <ArrowUp className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDown className="h-3 w-3 mr-1" />
                        )}
                        ${Math.abs(costBasis).toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentPositions;
