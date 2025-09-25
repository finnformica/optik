import type { EnrichedPosition } from "@/app/(dashboard)/dashboard/actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface CurrentPositionsProps {
  positions: EnrichedPosition[];
}

const CurrentPositions = ({ positions }: CurrentPositionsProps) => {
  const renderBadge = (itmPercentage?: number) => {
    if (itmPercentage === undefined) {
      return (
        <Badge
          variant="outline"
          className="bg-gray-500/10 text-gray-400 border-gray-500/20 text-xs"
        >
          N/A
        </Badge>
      );
    }

    const formattedPercentage = Math.abs(itmPercentage).toFixed(1);
    let content;
    let className;
    let sign;

    if (itmPercentage <= -5.0) {
      content = "ITM";
      sign = "-";
      className = "bg-red-500/10 text-red-400 border-red-500/20 text-xs";
    } else if (itmPercentage < 0) {
      content = "ITM";
      sign = "-";
      className =
        "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs";
    } else if (itmPercentage < 0.01) {
      content = "ATM";
      sign = "";
      className = "bg-gray-500/10 text-gray-400 border-gray-500/20 text-xs";
    } else {
      content = "OTM";
      sign = "+";
      className = "bg-green-500/10 text-green-400 border-green-500/20 text-xs";
    }

    return (
      <Badge variant="outline" className={className}>
        {content} {sign}
        {formattedPercentage}%
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
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider min-w-fit">
                  <div className="flex items-center gap-1">
                    Current
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3.5 h-3.5 text-gray-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Current stock price refreshed every 15 minutes</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
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
                    colSpan={7}
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
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                        {position.currentPrice
                          ? `$${position.currentPrice.toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        {renderBadge(position.itmPercentage)}
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
