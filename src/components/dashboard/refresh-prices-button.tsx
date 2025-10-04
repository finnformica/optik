"use client";

import { refreshStockPrices } from "@/app/(dashboard)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";

export default function RefreshPricesButton() {
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    startTransition(async () => {
      try {
        await refreshStockPrices();
      } catch (error) {
        console.error("Failed to refresh prices:", error);
      } finally {
        setIsRefreshing(false);
      }
    });
  };

  const isLoading = isPending || isRefreshing;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRefresh}
      disabled={isLoading}
      className="absolute top-1/2 right-3 h-8 w-8 -translate-y-1/2 p-0 text-gray-400 hover:text-gray-200"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
    </Button>
  );
}
