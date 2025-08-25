"use client";

import {
  AlertTriangle,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Mail,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

import { TradeDetails } from "@/components/positions/trade-details";
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
  const [expandedStrategies, setExpandedStrategies] = useState<Set<string>>(
    new Set()
  );
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleSymbolToggle = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setExpandedStrategies(new Set());
      setExpandedPositions(new Set());
    }
  };

  const handleStrategyToggle = (strategy: string) => {
    const newExpanded = new Set(expandedStrategies);
    if (newExpanded.has(strategy)) {
      newExpanded.delete(strategy);
      // Also collapse all positions within this strategy
      const positionsInStrategy = position.positions.filter(
        (p) => p.strategy === strategy
      );
      positionsInStrategy.forEach((pos) => {
        setExpandedPositions((prev) => {
          const newSet = new Set(prev);
          newSet.delete(pos.positionKey);
          return newSet;
        });
      });
    } else {
      newExpanded.add(strategy);
    }
    setExpandedStrategies(newExpanded);
  };

  const handlePositionToggle = (positionKey: string) => {
    const newExpanded = new Set(expandedPositions);
    if (newExpanded.has(positionKey)) {
      newExpanded.delete(positionKey);
    } else {
      newExpanded.add(positionKey);
    }
    setExpandedPositions(newExpanded);
  };

  // Group positions by strategy
  const positionsByStrategy = position.positions.reduce((acc, pos) => {
    const strategy = pos.strategy;
    if (!acc[strategy]) {
      acc[strategy] = [];
    }
    acc[strategy].push(pos);
    return acc;
  }, {} as Record<string, typeof position.positions>);

  return (
    <>
      {/* Level 1: Symbol Row */}
      <TableRow className="border-border hover:bg-muted/30">
        <TableCell className="w-8 p-2">
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
        </TableCell>
        <TableCell className="p-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base">{position.ticker}</span>
            <Badge
              variant="outline"
              className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs"
            >
              {position.totalPositions} positions
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
        <TableCell className="w-20 p-2">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
            >
              <BarChart3 className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
            >
              <Mail className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
            >
              <Check className="h-3 w-3" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Level 2: Strategy Groups */}
      {isExpanded && (
        <>
          {Object.entries(positionsByStrategy).map(([strategy, positions]) => (
            <TableRow key={strategy} className="border-border bg-muted/20">
              <TableCell className="w-8 p-2">
                <div className="ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStrategyToggle(strategy)}
                    className="p-0 h-4 w-4 text-muted-foreground hover:text-foreground"
                  >
                    {expandedStrategies.has(strategy) ? (
                      <ChevronDown className="w-2 h-2" />
                    ) : (
                      <ChevronRight className="w-2 h-2" />
                    )}
                  </Button>
                </div>
              </TableCell>
              <TableCell className="p-2">
                <div className="ml-4">
                  <span className="font-medium text-sm text-foreground">
                    {strategy}
                  </span>
                  <Badge
                    variant="outline"
                    className="ml-2 bg-gray-500/10 text-gray-400 border-gray-500/20 text-xs"
                  >
                    {positions.length} positions
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="w-32 p-2 text-muted-foreground text-sm">
                {formatCurrency(
                  positions.reduce(
                    (sum, pos) => sum + parseFloat(pos.totalPnl),
                    0
                  )
                )}
              </TableCell>
              <TableCell className="w-32 p-2 text-muted-foreground text-sm">
                {formatCurrency(
                  positions.reduce(
                    (sum, pos) => sum + parseFloat(pos.totalPnl),
                    0
                  )
                )}
              </TableCell>
              <TableCell className="w-32 p-2 text-muted-foreground text-sm">
                {formatCurrency(0)}
              </TableCell>
              <TableCell className="w-20 p-2"></TableCell>
            </TableRow>
          ))}

          {/* Level 3: Individual Positions */}
          {Object.entries(positionsByStrategy).map(([strategy, positions]) =>
            expandedStrategies.has(strategy)
              ? positions.map((pos) => (
                  <>
                    <TableRow
                      key={pos.positionKey}
                      className="border-border bg-muted/10"
                    >
                      <TableCell className="w-8 p-2">
                        <div className="ml-8">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handlePositionToggle(pos.positionKey)
                            }
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
                      <TableCell className="p-2">
                        <div className="ml-8">
                          <div className="text-sm text-foreground">
                            {pos.optionType && (
                              <span>
                                ${pos.strikePrice} {pos.optionType} •{" "}
                                {formatDate(pos.expiryDate!)}
                                {pos.daysToExpiry !== null && (
                                  <span
                                    className={
                                      pos.isExpiringSoon
                                        ? "text-yellow-400"
                                        : ""
                                    }
                                  >
                                    {" "}
                                    • {pos.daysToExpiry}d
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              Qty: {parseFloat(pos.netQuantity) > 0 ? "+" : ""}
                              {pos.netQuantity}
                            </Badge>
                            {pos.isExpiringSoon && (
                              <AlertTriangle className="h-3 w-3 text-yellow-400" />
                            )}
                          </div>
                        </div>
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
                      <TableCell className="w-20 p-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border text-foreground hover:bg-muted/90 hover:border-muted-foreground h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Trade Details Row */}
                    {expandedPositions.has(pos.positionKey) && (
                      <TableRow
                        key={`${pos.positionKey}-details`}
                        className="border-border bg-background hover:bg-background"
                      >
                        <TableCell colSpan={6} className="p-4">
                          <TradeDetails transactions={pos.transactions} />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              : null
          )}
        </>
      )}
    </>
  );
}
