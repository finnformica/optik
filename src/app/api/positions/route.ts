import { db } from "@/lib/db/config";
import { getUser } from "@/lib/db/queries";
import { positionsBySymbol, PositionsBySymbol } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get("ticker");
    const strategy = searchParams.get("strategy");

    // Query open positions
    const openPositionsData = await db
      .select()
      .from(positionsBySymbol)
      .where(and(
        eq(positionsBySymbol.userId, user.id),
        eq(positionsBySymbol.positionType, 'OPEN')
      ))
      .orderBy(positionsBySymbol.totalPnl);

    // Query closed positions
    const closedPositionsData = await db
      .select()
      .from(positionsBySymbol)
      .where(and(
        eq(positionsBySymbol.userId, user.id),
        eq(positionsBySymbol.positionType, 'CLOSED')
      ))
      .orderBy(positionsBySymbol.totalPnl);

    // Transform the data with client-side filtering (keeping locale flexibility)
    const transformPositionsData = (data: PositionsBySymbol[]) => {
      return data
        .filter(row => row.ticker) // Filter out null tickers
        .map(row => {
          const positions = JSON.parse(row.positionsData || '[]').filter((position: any) => {
            // Apply filters
            const matchesStrategy = !strategy || 
              position.strategy.toLowerCase().includes(strategy.toLowerCase());
            return matchesStrategy;
          });

          return {
            ticker: row.ticker!,
            totalPositions: parseInt(row.totalPositions || '0'),
            totalPnl: parseFloat(row.totalPnl || '0'),
            realizedPnl: parseFloat(row.realizedPnl || '0'),
            unrealizedPnl: parseFloat(row.unrealizedPnl || '0'),
            totalFees: parseFloat(row.totalFees || '0'),
            expiringSoonCount: parseInt(row.expiringSoonCount || '0'),
            positions
          };
        }).filter(group => {
          // Apply ticker filter and ensure group has positions
          const matchesTicker = !ticker || group.ticker.toLowerCase().includes(ticker.toLowerCase());
          return matchesTicker && group.positions.length > 0;
        });
    };

    const openPositions = transformPositionsData(openPositionsData);
    const closedPositions = transformPositionsData(closedPositionsData);

    // Calculate summary stats
    const openStats = {
      totalPositions: openPositions.reduce((sum, group) => sum + group.totalPositions, 0),
      totalPnl: openPositions.reduce((sum, group) => sum + group.totalPnl, 0),
      expiringSoonTotal: openPositions.reduce((sum, group) => sum + group.expiringSoonCount, 0),
    };

    const closedStats = {
      totalPositions: closedPositions.reduce((sum, group) => sum + group.totalPositions, 0),
      totalPnl: closedPositions.reduce((sum, group) => sum + group.totalPnl, 0),
    };

    return NextResponse.json({
      openPositions,
      closedPositions,
      openStats,
      closedStats,
    });
  } catch (error) {
    console.error("Error fetching positions:", error);
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 }
    );
  }
}
