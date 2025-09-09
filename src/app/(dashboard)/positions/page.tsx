import { PositionFilters } from "@/components/positions/position-filters";
import { PositionStats } from "@/components/positions/position-stats";
import { PositionTable } from "@/components/positions/position-table";

export default function PositionsPage() {
  // Placeholder data - to be implemented later
  const currentStats = {
    totalPositions: 0,
    totalPnl: 0,
    expiringSoonTotal: 0,
  };

  return (
    <>
      {/* Page Title */}
      <h1 className="text-3xl font-semibold mb-4">Positions</h1>

      {/* Stats Component */}
      <PositionStats stats={currentStats} isOpen={true} />

      {/* Filters Component */}
      <PositionFilters
        activeTab="open"
        tickerFilter=""
        strategyFilter=""
        onTabChange={() => {}}
        onTickerChange={() => {}}
        onStrategyChange={() => {}}
        openCount={0}
        closedCount={0}
      />

      {/* Table Component */}
      <PositionTable
        positions={[]}
        isOpen={true}
        isLoading={false}
        error={null}
      />
    </>
  );
}