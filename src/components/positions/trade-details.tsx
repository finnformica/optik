"use client";

import { PositionTransaction } from "@/types/positions";

interface TradeDetailsProps {
  transactions: PositionTransaction[];
}

export function TradeDetails({ transactions }: TradeDetailsProps) {
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

  return (
    <div className="ml-12 space-y-2">
      <div className="text-xs font-medium text-muted-foreground mb-2">
        Trade Details
      </div>
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="bg-muted border border-border rounded p-2 text-xs"
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground">Date:</span>
              <span className="ml-1">{formatDate(transaction.date)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Action:</span>
              <span
                className={`ml-1 font-medium ${
                  transaction.displayAction === "BUY"
                    ? "text-blue-400"
                    : "text-orange-400"
                }`}
              >
                {transaction.displayAction}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Quantity:</span>
              <span className="ml-1">
                {Math.abs(parseFloat(transaction.quantity))}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Price:</span>
              <span className="ml-1">{transaction.priceDisplay}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Premium:</span>
              <span className="ml-1">{formatCurrency(transaction.amount)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Fees:</span>
              <span className="ml-1">{formatCurrency(transaction.fees)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">P/L:</span>
              <span
                className={`ml-1 font-medium ${
                  parseFloat(transaction.transactionPnl) >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrency(transaction.transactionPnl)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Effect:</span>
              <span className="ml-1">{transaction.positionEffect}</span>
            </div>
          </div>
          {transaction.description && (
            <div className="mt-1 text-muted-foreground">
              {transaction.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
