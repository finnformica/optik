import { Badge } from "@/components/ui/badge";
import { ITransactionAction } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import _ from "lodash";

const ActionBadge = ({ action }: { action: ITransactionAction }) => {
  const badges: React.ReactNode[] = [];

  // Handle compound actions by splitting and processing each part
  const actionParts = action.split("_");

  actionParts.forEach((part, index) => {
    let className;

    switch (part) {
      case "buy":
      case "open":
        className = "text-green-500";
        break;
      case "sell":
      case "close":
        className = "text-red-500";
        break;
      case "expire":
      case "assign":
      case "other":
        className = "text-slate-400";
        break;
      case "dividend":
      case "interest":
      case "transfer":
        className = "text-blue-500";
        break;
      default:
        break;
    }

    if (className) {
      badges.push(
        <Badge
          key={`${action}-${index}`}
          className={cn("bg-muted border-muted hover:bg-muted/80", className)}
        >
          {_.startCase(part)}
        </Badge>
      );
    }
  });

  return badges;
};

export default ActionBadge;
