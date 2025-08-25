"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PositionFiltersProps {
  activeTab: string;
  tickerFilter: string;
  strategyFilter: string;
  onTabChange: (value: string) => void;
  onTickerChange: (value: string) => void;
  onStrategyChange: (value: string) => void;
  openCount: number;
  closedCount: number;
}

export function PositionFilters({
  activeTab,
  tickerFilter,
  strategyFilter,
  onTabChange,
  onTickerChange,
  onStrategyChange,
  openCount,
  closedCount,
}: PositionFiltersProps) {
  return (
    <div className="space-y-6 mb-6">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="open">Open Positions ({openCount})</TabsTrigger>
          <TabsTrigger value="closed">
            Closed Positions ({closedCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Filter by ticker (e.g., AAPL, TSLA)..."
            onChange={(e) => onTickerChange(e.target.value)}
            className="pl-10"
            defaultValue={tickerFilter}
          />
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Filter by strategy (e.g., Short Put, Long Call)..."
            onChange={(e) => onStrategyChange(e.target.value)}
            className="pl-10"
            defaultValue={strategyFilter}
          />
        </div>
      </div>
    </div>
  );
}
