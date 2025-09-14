"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

import ActionBadge from "@/components/global/trade-action-badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { PositionTransaction } from "@/types/positions";

interface TransactionRowProps {
  transaction: PositionTransaction;
}

export function TransactionRow({ transaction }: TransactionRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isOption = !!transaction.optionType;

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

  const transactionDetails = [
    {
      label: isOption ? "Premium" : "Amount",
      value: formatCurrency(transaction.amount),
    },
    {
      label: "Type",
      value: transaction.creditDebitType,
    },
    {
      label: "Fees",
      value: formatCurrency(transaction.fees),
    },
    {
      label: "Action",
      value: transaction.action,
    },
    {
      label: isOption ? "Strike Price" : "Unit Price",
      value: formatCurrency(transaction.unitPrice),
    },
    {
      label: "Date",
      value: formatDate(transaction.date),
    },
    {
      label: "Cost Basis",
      value: formatCurrency(transaction.costBasis),
    },
  ];

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
        <TableCell className="w-20 p-2 text-center">
          <span className="text-xs font-medium">
            {transaction.quantity > 0
              ? `+${transaction.quantity}`
              : transaction.quantity}
          </span>
        </TableCell>
        <TableCell className="w-32 p-2">
          <span
            className={`text-xs font-medium ${
              transaction.realizedPnl + transaction.unrealizedPnl >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatCurrency(
              transaction.realizedPnl + transaction.unrealizedPnl,
            )}
          </span>
        </TableCell>
        <TableCell className="w-32 p-2 text-muted-foreground text-xs">
          {formatCurrency(transaction.unrealizedPnl)}
        </TableCell>
        <TableCell className="w-32 p-2 text-muted-foreground text-xs">
          {formatCurrency(transaction.realizedPnl)}
        </TableCell>
        <TableCell className="w-32 p-2">
          <span className="text-xs text-muted-foreground">
            {formatCurrency(transaction.costBasis)}
          </span>
        </TableCell>
        <TableCell className="w-24 p-2">
          <span className="text-xs text-muted-foreground">
            {formatCurrency(transaction.fees)}
          </span>
        </TableCell>
      </TableRow>

      {/* Transaction Details Row (expanded) */}
      {isExpanded && (
        <TableRow className="border-border bg-background hover:bg-background">
          <TableCell colSpan={8} className="p-4">
            <div className="ml-16 space-y-2">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Transaction Details
              </div>
              <div className="bg-muted border border-border rounded p-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  {transactionDetails.map((item, index) => (
                    <div key={index}>
                      <span className="text-muted-foreground">
                        {item.label}:
                      </span>
                      <span className="ml-2">{item.value}</span>
                    </div>
                  ))}
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
