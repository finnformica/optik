"use client";

import { Loading } from "@/components/global/loading";
import { PositionRow } from "@/components/positions/position-row";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SymbolGroup } from "@/types/positions";

interface PositionTableProps {
  positions: SymbolGroup[];
  isOpen: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function PositionTable({
  positions,
  isOpen,
  isLoading,
  error,
}: PositionTableProps) {
  // Loading state
  if (isLoading) {
    return <Loading message="Loading positions..." />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">Error: {error.message}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (positions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-muted-foreground mb-4">
            <svg
              className="h-12 w-12 mx-auto mb-4 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="text-lg font-medium mb-2">
              No {isOpen ? "open" : "closed"} positions found
            </h3>
            <p className="text-sm">
              {isOpen
                ? "Start trading to see your open positions here."
                : "Closed positions will appear here after you complete trades."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-muted/50">
            <TableHead className="text-muted-foreground font-semibold w-20" />
            <TableHead className="text-muted-foreground font-semibold">
              Symbol
            </TableHead>
            <TableHead className="text-muted-foreground font-semibold w-20">
              Quantity
            </TableHead>
            <TableHead className="text-muted-foreground font-semibold w-32">
              Total P/L
            </TableHead>
            <TableHead className="text-muted-foreground font-semibold w-32">
              Open P/L
            </TableHead>
            <TableHead className="text-muted-foreground font-semibold w-32">
              Realized P/L
            </TableHead>
            <TableHead className="text-muted-foreground font-semibold w-32">
              Cost Basis
            </TableHead>
            <TableHead className="text-muted-foreground font-semibold w-24">
              Fees
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((position, index) => (
            <PositionRow
              key={position.ticker}
              position={position}
              index={index}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
