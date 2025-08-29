import { getUserId } from "@/lib/auth/session";
import { db } from "@/lib/db/config";
import { viewPositions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get("ticker");
    const strategy = searchParams.get("strategy");

    // Query all positions using the unified view
    const allPositionsData = await db
      .select()
      .from(viewPositions)
      .where(eq(viewPositions.userId, userId));

    // Transform and group positions by company
    const transformPositionsData = (status: 'OPEN' | 'CLOSED') => {
      const filteredPositions = allPositionsData.filter(row => row.positionStatus === status);
      
      // Group by company (underlying symbol)
      const groupedByCompany = filteredPositions.reduce((acc, position) => {
        const tickerSymbol = position.underlyingSymbol!;
        
        if (!acc[tickerSymbol]) {
          acc[tickerSymbol] = {
            ticker: tickerSymbol,
            totalPositions: 0,
            totalPnl: 0,
            realizedPnl: 0,
            unrealizedPnl: 0,
            totalFees: 0,
            expiringSoonCount: 0,
            positions: []
          };
        }

        // Determine strategy for filtering
        const positionStrategy = position.securityType === 'STOCK' ? 'LONG_STOCK' :
                               position.optionType === 'PUT' && parseFloat(position.quantityHeld || '0') < 0 ? 'CASH_SECURED_PUTS' :
                               position.optionType === 'CALL' && parseFloat(position.quantityHeld || '0') < 0 ? 'COVERED_CALLS' :
                               'OTHER';

        // Apply filters
        const matchesStrategy = !strategy || positionStrategy.toLowerCase().includes(strategy.toLowerCase());
        const matchesTicker = !ticker || tickerSymbol.toLowerCase().includes(ticker.toLowerCase());
        
        if (matchesStrategy && matchesTicker) {
          acc[tickerSymbol].totalPositions += 1;
          acc[tickerSymbol].realizedPnl += parseFloat(position.realisedPnl || '0');
          acc[tickerSymbol].totalFees += parseFloat(position.totalFees || '0');
          
          // For open positions, add cost basis to total P/L (unrealised)
          if (status === 'OPEN') {
            acc[tickerSymbol].unrealizedPnl += parseFloat(position.costBasis || '0');
          }
          
          // Count expiring soon (within 30 days)
          if (position.daysToExpiry !== null && position.daysToExpiry <= 30) {
            acc[tickerSymbol].expiringSoonCount += 1;
          }

          acc[tickerSymbol].positions.push({
            symbol: position.symbol,
            securityType: position.securityType,
            optionType: position.optionType,
            strikePrice: position.strikePrice ? parseFloat(position.strikePrice) : null,
            expiryDate: position.expiryDate,
            quantityHeld: parseFloat(position.quantityHeld || '0'),
            costBasis: parseFloat(position.costBasis || '0'),
            averagePrice: parseFloat(position.averagePrice || '0'),
            realisedPnl: parseFloat(position.realisedPnl || '0'),
            totalFees: parseFloat(position.totalFees || '0'),
            daysToExpiry: position.daysToExpiry,
            direction: position.direction,
            strategy: positionStrategy,
            firstTransactionDate: position.firstTransactionDate,
            lastTransactionDate: position.lastTransactionDate,
            transactionCount: position.transactionCount
          });
        }

        return acc;
      }, {} as Record<string, any>);

      // Convert to array and calculate final totals
      return Object.values(groupedByCompany).map((group: any) => {
        group.totalPnl = group.realizedPnl + (status === 'OPEN' ? 0 : 0); // Adjust based on your P/L calculation needs
        return group;
      }).filter((group: any) => group.positions.length > 0);
    };

    const openPositions = transformPositionsData('OPEN');
    const closedPositions = transformPositionsData('CLOSED');

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