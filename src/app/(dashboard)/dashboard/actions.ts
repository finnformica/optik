"use server";

import { db } from "@/lib/db/config";
import {
  factStockPrices,
  NewFactStockPrices,
  viewCurrentPosition,
  ViewCurrentPosition,
} from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";

class FinnhubClient {
  private baseUrl = "https://finnhub.io/api/v1";
  private apiKey: string;

  constructor() {
    if (!process.env.FINNHUB_API_KEY) {
      throw new Error("FINNHUB_API_KEY is required");
    }

    this.apiKey = process.env.FINNHUB_API_KEY;
  }

  async getQuote(symbol: string): Promise<number | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/quote?symbol=${symbol}&token=${this.apiKey}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Check if response has current price data
      if (data && typeof data.c === "number" && data.c > 0) {
        return data.c;
      }

      return null;
    } catch (error) {
      console.error(`Failed to fetch quote for ${symbol}:`, error);
      return null;
    }
  }
}

const finnhubClient = new FinnhubClient();

interface StockPrice {
  symbol: string;
  price: number;
  cached: boolean;
}

export interface EnrichedPosition extends ViewCurrentPosition {
  currentPrice?: number;
  itmPercentage?: number;
}

async function getStockPrices(
  symbols: string[],
): Promise<Record<string, StockPrice>> {
  if (symbols.length === 0) return {};

  // Get current date and quarter hour
  const now = new Date();
  const currentDateKey = parseInt(
    `${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`,
  );

  // Calculate current quarter hour (1-96)
  const currentQuarterHour =
    Math.floor(now.getHours() * 4 + now.getMinutes() / 15) + 1;

  // Check cache for all symbols
  const cachedPrices = await db
    .select()
    .from(factStockPrices)
    .where(
      and(
        inArray(factStockPrices.symbol, symbols),
        eq(factStockPrices.dateKey, currentDateKey),
        eq(factStockPrices.quarterHour, currentQuarterHour),
      ),
    );

  const priceMap: Record<string, StockPrice> = {};
  const cachedSymbols = new Set<string>();

  // Add cached prices to result
  for (const cached of cachedPrices) {
    priceMap[cached.symbol] = {
      symbol: cached.symbol,
      price: parseFloat(cached.price),
      cached: true,
    };
    cachedSymbols.add(cached.symbol);
  }

  // Find symbols that need fresh data
  const symbolsToFetch = symbols.filter((symbol) => !cachedSymbols.has(symbol));

  if (symbolsToFetch.length > 0) {
    try {
      // Fetch prices from Finnhub API
      const fetchPromises = symbolsToFetch.map(async (symbol) => {
        try {
          const price = await finnhubClient.getQuote(symbol);

          if (price !== null) {
            // Cache the price
            const newPriceRecord: NewFactStockPrices = {
              symbol,
              dateKey: currentDateKey,
              quarterHour: currentQuarterHour,
              price: price.toString(),
            };

            await db
              .insert(factStockPrices)
              .values(newPriceRecord)
              .onConflictDoNothing();

            priceMap[symbol] = {
              symbol,
              price,
              cached: false,
            };
          }
        } catch (error) {
          console.error(`Failed to fetch price for ${symbol}:`, error);
        }
      });

      await Promise.all(fetchPromises);
    } catch (error) {
      console.error("Finnhub API error:", error);
    }
  }

  return priceMap;
}

export async function getPositionsWithPrices(
  accountKey: number,
): Promise<EnrichedPosition[]> {
  // Fetch positions
  const positions = await db
    .select()
    .from(viewCurrentPosition)
    .where(
      and(
        eq(viewCurrentPosition.accountKey, accountKey),
        eq(viewCurrentPosition.positionStatus, "OPEN"),
      ),
    )
    .limit(50);

  if (positions.length === 0) return [];

  // Extract unique underlying symbols for stock price lookup
  const underlyingSymbols = Array.from(
    new Set(positions.map((p) => p.underlyingSymbol).filter(Boolean)),
  ) as string[];

  // Get stock prices for all underlying symbols
  const stockPrices = await getStockPrices(underlyingSymbols);

  // Enrich positions with current prices and ITM calculations
  const enrichedPositions: EnrichedPosition[] = positions.map((position) => {
    const enriched: EnrichedPosition = { ...position };

    if (position.underlyingSymbol) {
      const stockPrice = stockPrices[position.underlyingSymbol];

      if (stockPrice) {
        enriched.currentPrice = stockPrice.price;

        // Calculate ITM percentage for options
        if (
          position.securityType === "OPTION" &&
          position.strikePrice &&
          position.optionType
        ) {
          const strikePrice = parseFloat(position.strikePrice);
          const currentPrice = stockPrice.price;

          if (position.optionType === "CALL") {
            // For calls: ITM when current price > strike price (negative for seller)
            enriched.itmPercentage =
              ((strikePrice - currentPrice) / strikePrice) * 100;
          } else if (position.optionType === "PUT") {
            // For puts: ITM when current price < strike price (negative for seller)
            enriched.itmPercentage =
              ((currentPrice - strikePrice) / strikePrice) * 100;
          }
        }
      }
    }

    return enriched;
  });

  return enrichedPositions;
}
