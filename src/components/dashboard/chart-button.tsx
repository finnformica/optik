"use client";

import { BarChart3 } from "lucide-react";
import { useState } from "react";

import { TradingViewChartDialog } from "./trading-view-chart-dialog";
import { Button } from "@/components/ui/button";

interface ChartButtonProps {
  symbol: string;
  className?: string;
}

export function ChartButton({ symbol, className = "" }: ChartButtonProps) {
  const [isChartOpen, setIsChartOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsChartOpen(true);
  };

  const handleChartClose = () => {
    setIsChartOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 text-gray-400 hover:text-gray-200 ${className}`}
      >
        <BarChart3 className="h-3 w-3" />
      </Button>
      <TradingViewChartDialog
        isOpen={isChartOpen}
        onClose={handleChartClose}
        symbol={symbol}
      />
    </>
  );
}