"use client";

import {
  ChevronDown,
  ChevronRight,
  Clock,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

import { TransactionRow } from "@/components/positions/transaction-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { SymbolGroup } from "@/types/positions";

interface PositionRowProps {
  position: SymbolGroup;
  index: number;
}

export function PositionRow({ position, index }: PositionRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(
    new Set()
  );
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(
    new Set()
  );

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(num);
  };

  const handleSymbolToggle = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setExpandedPositions(new Set());
      setExpandedTransactions(new Set());
    }
  };

  const handlePositionToggle = (positionKey: string) => {
    const newExpanded = new Set(expandedPositions);
    if (newExpanded.has(positionKey)) {
      newExpanded.delete(positionKey);
      const newExpandedTransactions = new Set(expandedTransactions);
      Array.from(expandedTransactions).forEach((transactionKey) => {
        if (transactionKey.startsWith(positionKey)) {
          newExpandedTransactions.delete(transactionKey);
        }
      });
      setExpandedTransactions(newExpandedTransactions);
    } else {
      newExpanded.add(positionKey);
    }
    setExpandedPositions(newExpanded);
  };

  return (
    <>
      {/* Level 1: Symbol Row */}
      <TableRow className="border-border hover:bg-muted/30">
        <TableCell className="p-2">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSymbolToggle}
              className="p-0 h-5 w-5 text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </Button>
          </div>
        </TableCell>
        <TableCell className="p-2">
          <div className="flex items-center gap-2">
            <p className="text-md font-semibold">{position.ticker}</p>
            <Badge
              variant="outline"
              className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs"
            >
              {position.totalPositions} position
              {position.totalPositions === 1 ? "" : "s"}
            </Badge>
            {position.expiringSoonCount > 0 && (
              <Badge
                variant="outline"
                className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs"
              >
                <Clock className="h-2 w-2 mr-1" />
                {position.expiringSoonCount} expiring soon
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell className="w-20 p-2 text-muted-foreground text-sm text-center">
          —
        </TableCell>
        <TableCell className="w-32 p-2">
          <span
            className={`font-medium flex items-center text-sm ${
              position.totalPnl >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {position.totalPnl >= 0 ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {formatCurrency(position.totalPnl)}
          </span>
        </TableCell>
        <TableCell className="w-32 p-2 text-muted-foreground text-sm">
          {formatCurrency(position.totalPnl)}
        </TableCell>
        <TableCell className="w-32 p-2 text-muted-foreground text-sm">
          {formatCurrency(0)} {/* Will calculate when we have realized P/L */}
        </TableCell>
        <TableCell className="w-32 p-2 text-muted-foreground text-sm">
          —
        </TableCell>
        <TableCell className="w-24 p-2 text-muted-foreground text-sm">
          —
        </TableCell>
      </TableRow>

      {/* Level 2: Individual Positions */}
      {isExpanded && (
        <>
          {position.positions.map((pos) => (
            <>
              {/* Position Summary Row */}
              <TableRow
                key={pos.positionKey}
                className="border-border bg-muted/10"
              >
                <TableCell className="w-8 p-2">
                  <div className="ml-4 flex items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePositionToggle(pos.positionKey)}
                      className="p-0 h-4 w-4 text-muted-foreground hover:text-foreground"
                    >
                      {expandedPositions.has(pos.positionKey) ? (
                        <ChevronDown className="w-2 h-2" />
                      ) : (
                        <ChevronRight className="w-2 h-2" />
                      )}
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="p-2 pl-8">
                  <div className="text-sm text-foreground">
                    {pos.optionType && (
                      <span>{`${pos.ticker} $${pos.strikePrice} ${pos.optionType} - ${pos.daysHeld} days in trade`}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="w-20 p-2 text-muted-foreground text-sm text-center">
                  —
                </TableCell>
                <TableCell className="w-32 p-2">
                  <span
                    className={`text-sm font-medium ${
                      parseFloat(pos.totalPnl) >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatCurrency(pos.totalPnl)}
                  </span>
                </TableCell>
                <TableCell className="w-32 p-2 text-muted-foreground text-sm">
                  {formatCurrency(pos.totalPnl)}
                </TableCell>
                <TableCell className="w-32 p-2 text-muted-foreground text-sm">
                  {formatCurrency(pos.realizedPnl)}
                </TableCell>
                <TableCell className="w-32 p-2 text-muted-foreground text-sm">
                  {formatCurrency(pos.costBasis)}
                </TableCell>
                <TableCell className="w-24 p-2 text-muted-foreground text-sm">
                  {formatCurrency(pos.totalFees)}
                </TableCell>
              </TableRow>

              {/* Position Details Row */}
              {expandedPositions.has(pos.positionKey) &&
                pos.transactions.map((transaction) => (
                  <TransactionRow
                    key={`${pos.positionKey}-${transaction.id}`}
                    transaction={transaction}
                  />
                ))}
            </>
          ))}
        </>
      )}
    </>
  );
}
