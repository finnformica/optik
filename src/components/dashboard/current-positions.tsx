import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrentPosition } from "@/lib/db/schema";
interface CurrentPositionsProps {
  positions: CurrentPosition[];
}

const CurrentPositions = ({ positions }: CurrentPositionsProps) => {
  return (
    <Card className="bg-[#1a2236] border-gray-800 py-0">
      <CardHeader className="border-b border-gray-800 p-4">
        <CardTitle className="text-white">Current Positions</CardTitle>
      </CardHeader>
      <CardContent className="px-2">
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
                  Quantity
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {positions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-8 text-center text-gray-400"
                  >
                    No open positions found
                  </td>
                </tr>
              ) : (
                positions.map((position, index) => {
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
                          ? `$${parseFloat(position.strikePrice).toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                        {position.expiryDisplay || "-"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                        {parseFloat(position.netQuantity || "0") > 0 ? "+" : ""}
                        {parseFloat(position.netQuantity || "0")}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400">
                          {position.positionType}
                        </span>
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
