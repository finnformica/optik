import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ViewPosition } from "@/lib/db/schema";
import { Badge } from "../ui/badge";
interface CurrentPositionsProps {
  positions: ViewPosition[];
}

const CurrentPositions = ({ positions }: CurrentPositionsProps) => {
  const renderBadge = (percentDrawdown: number) => {
    let content;
    let className;
    if (percentDrawdown >= 9.999) {
      content = "ITM";
      className = "bg-red-500/10 text-red-400 border-red-500/20 text-xs";
    } else if (percentDrawdown >= 0.001) {
      content = "ITM";
      className =
        "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs";
    } else {
      content = "OTM";
      className = "bg-green-500/10 text-green-400 border-green-500/20 text-xs";
    }

    return (
      <Badge variant="outline" className={className}>
        {content} {percentDrawdown.toFixed(1)}%
      </Badge>
    );
  };

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
                  ITM %
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
                      key={`${position.underlyingSymbol}-${position.strikePrice}-${index}`}
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-white">
                        {position.underlyingSymbol}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                        {position.optionType ?? position.securityType ?? "N/A"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                        {position.strikePrice
                          ? `$${parseFloat(position.strikePrice).toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                        {position.expiryDate
                          ? new Date(position.expiryDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                        {parseFloat(position.quantityHeld || "0") > 0
                          ? "+"
                          : ""}
                        {parseFloat(position.quantityHeld || "0")}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        {renderBadge(2.5)}
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
