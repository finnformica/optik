"use client";

import { TradingViewChart } from "@/components/global/trading-view-chart";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TradingViewChartDialogProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
}

export function TradingViewChartDialog({
  isOpen,
  onClose,
  symbol,
}: TradingViewChartDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[90vh] w-[90vw] flex-col p-4 sm:max-w-[90vw]">
        <DialogHeader className="flex-shrink-0 pb-2">
          <DialogTitle className="text-xl font-semibold">
            {symbol} Chart
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1">
          <TradingViewChart
            symbol={symbol}
            height="100%"
            hideSideToolbar
            hideTopToolbar
            studies={["STD;Bollinger_Bands"]}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
