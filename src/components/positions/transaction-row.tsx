"use client";

import _ from "lodash";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { PositionTransaction } from "@/types/positions";
import ActionBadge from "../global/trade-action-badge";

interface TransactionRowProps {
  transaction: PositionTransaction;
}

const renderActionBadge = (action: string, positionEffect: string) => {
  const badges: React.ReactNode[] = [];

  // Process displayAction (BUY/SELL)
  let actionClassName;
  switch (action.toLowerCase()) {
    case "buy":
    case "open":
      actionClassName = "text-green-500 border-green-500/20 bg-green-500/10";
      break;
    case "sell":
    case "close":
      actionClassName = "text-red-500 border-red-500/20 bg-red-500/10";
      break;
    default:
      actionClassName = "text-blue-500 border-blue-500/20 bg-blue-500/10";
      break;
  }

  badges.push(
    <Badge
      key="action"
      variant="outline"
      className={cn("text-xs", actionClassName)}
    >
      {action}
    </Badge>
  );

  // Process positionEffect (OPENING/CLOSING)
  if (positionEffect && positionEffect !== "OTHER") {
    let effectClassName;
    switch (positionEffect.toLowerCase()) {
      case "opening":
        effectClassName = "text-blue-400 border-blue-400/20 bg-blue-400/10";
        break;
      case "closing":
        effectClassName =
          "text-orange-400 border-orange-400/20 bg-orange-400/10";
        break;
      default:
        effectClassName = "text-slate-400 border-slate-400/20 bg-slate-400/10";
        break;
    }

    badges.push(
      <Badge
        key="effect"
        variant="outline"
        className={cn("text-xs", effectClassName)}
      >
        {_.startCase(positionEffect.toLowerCase())}
      </Badge>
    );
  }

  return badges;
};

export function TransactionRow({ transaction }: TransactionRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().split("T")[0];
  };

  console.log(transaction);

  return (
    <>
      {/* Transaction Summary Row */}
      <TableRow className="border-border bg-muted/5">
        <TableCell className="w-8 p-2">
          <div className="ml-8 flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-0 h-3 w-3 text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? (
                <ChevronDown className="w-2 h-2" />
              ) : (
                <ChevronRight className="w-2 h-2" />
              )}
            </Button>
          </div>
        </TableCell>
        <TableCell className="p-2 pl-12">
          <div className="flex items-center gap-2">
            <span className="text-xs">{formatDate(transaction.date)}</span>
            <div className="flex gap-1">
              <ActionBadge action={transaction.action} />
            </div>
          </div>
        </TableCell>
        <TableCell className="w-32 p-2" />
        <TableCell className="w-32 p-2">
          <span
            className={`text-xs font-medium ${
              parseFloat(transaction.transactionPnl) >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatCurrency(transaction.transactionPnl)}
          </span>
        </TableCell>
        <TableCell className="w-32 p-2">
          <span className="text-xs text-muted-foreground">
            {formatCurrency(transaction.amount)}
          </span>
        </TableCell>
        <TableCell className="w-20 p-2" />
      </TableRow>

      {/* Transaction Details Row (expanded) */}
      {isExpanded && (
        <TableRow className="border-border bg-background">
          <TableCell colSpan={6} className="p-4">
            <div className="ml-16 space-y-2">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Transaction Details
              </div>
              <div className="bg-muted border border-border rounded p-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground">Premium:</span>
                    <span className="ml-2 font-medium">
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fees:</span>
                    <span className="ml-2">
                      {formatCurrency(transaction.fees)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Unit Price:</span>
                    <span className="ml-2">
                      {formatCurrency(transaction.unitPrice)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-2">{transaction.creditDebitType}</span>
                  </div>
                </div>
                {transaction.description && (
                  <div className="mt-2 pt-2 border-t border-border text-muted-foreground">
                    <span className="text-muted-foreground">Description:</span>
                    <span className="ml-2">{transaction.description}</span>
                  </div>
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
