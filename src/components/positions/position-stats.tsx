"use client";

import { Badge } from "@/components/ui/badge";
import { PositionsStats } from "@/types/positions";
import { Clock, TrendingDown, TrendingUp } from "lucide-react";

interface PositionStatsProps {
  stats: PositionsStats;
  isOpen: boolean;
}

export function PositionStats({ stats, isOpen }: PositionStatsProps) {
  return (
    <div className="flex gap-4 mb-6">
      <Badge
        variant="secondary"
        className="bg-blue-500/10 border-blue-500/20 text-blue-400 px-3 py-1"
      >
        {stats.totalPositions} position{stats.totalPositions === 1 ? "" : "s"}
      </Badge>
      <Badge
        variant="secondary"
        className={`px-3 py-1 ${
          stats.totalPnl >= 0
            ? "bg-green-500/10 border-green-500/20 text-green-400"
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}
      >
        {stats.totalPnl >= 0 ? (
          <TrendingUp className="h-3 w-3 mr-1" />
        ) : (
          <TrendingDown className="h-3 w-3 mr-1" />
        )}
        ${Math.abs(stats.totalPnl).toFixed(2)} Total P/L
      </Badge>
      {isOpen && stats.expiringSoonTotal && stats.expiringSoonTotal > 0 ? (
        <Badge
          variant="secondary"
          className="bg-yellow-500/10 border-yellow-500/20 text-yellow-400 px-3 py-1"
        >
          <Clock className="h-3 w-3 mr-1" />
          {stats.expiringSoonTotal} Expiring Soon
        </Badge>
      ) : null}
    </div>
  );
}
