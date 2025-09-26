import type { EnrichedPosition } from "@/app/(dashboard)/dashboard/actions";
import { DashboardWidget } from "@/components/dashboard/dashboard-widget";
import { Badge } from "@/components/ui/badge";
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
          className="border-gray-500/20 bg-gray-500/10 text-xs text-gray-400"
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
    <DashboardWidget
      title="Current Positions"
      contentClassName="py-0 px-2 overflow-x-scroll"
    >
      <table className="min-w-full divide-y divide-gray-700">
        <thead>
          <tr className="[&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-medium [&_th]:tracking-wider [&_th]:text-gray-400 [&_th]:uppercase">
            <th>Symbol</th>
            <th>Type</th>
            <th>Strike</th>
            <th>Expiry</th>
            <th>Quantity</th>
            <th className="flex items-center gap-1">
              Current
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 cursor-help text-gray-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Current stock price refreshed every 15 minutes</p>
                </TooltipContent>
              </Tooltip>
            </th>
            <th>ITM %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {positions.length === 0
            ? Array.from({ length: 3 }).map((_, index) => (
                <tr
                  key={`empty-${index}`}
                  className="[&_td]:px-3 [&_td]:py-2 [&_td]:text-sm [&_td]:whitespace-nowrap [&_td]:text-gray-600 [&_td]:opacity-50"
                >
                  <td>---</td>
                  <td>---</td>
                  <td>---</td>
                  <td>---</td>
                  <td>---</td>
                  <td>---</td>
                  <td>---</td>
                </tr>
              ))
            : positions.map((position, index) => {
                return (
                  <tr
                    key={`${position.underlyingSymbol}-${position.strikePrice}-${index}`}
                    className="[&_td]:px-3 [&_td]:py-2 [&_td]:text-sm [&_td]:whitespace-nowrap [&_td]:text-gray-300"
                  >
                    <td className="font-medium text-white">
                      {position.underlyingSymbol}
                    </td>
                    <td>
                      {position.optionType ?? position.securityType ?? "N/A"}
                    </td>
                    <td>
                      {position.strikePrice
                        ? `$${parseFloat(position.strikePrice).toFixed(2)}`
                        : "-"}
                    </td>
                    <td>
                      {position.expiryDate
                        ? new Date(position.expiryDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      {parseFloat(position.quantity || "0") > 0 ? "+" : ""}
                      {parseFloat(position.quantity || "0")}
                    </td>
                    <td>
                      {position.currentPrice
                        ? `$${position.currentPrice.toFixed(2)}`
                        : "-"}
                    </td>
                    <td>{renderBadge(position.itmPercentage)}</td>
                  </tr>
                );
              })}
        </tbody>
      </table>
    </DashboardWidget>
  );
};

export default CurrentPositions;
