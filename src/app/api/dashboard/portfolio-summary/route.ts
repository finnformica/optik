import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/config";
import { viewPortfolioSummary } from "@/lib/db/schema";
import { getAccountKey } from "@/lib/supabase/server";

export async function GET() {
  try {
    const accountKey = await getAccountKey();

    const [portfolioSummary] = await db
      .select()
      .from(viewPortfolioSummary)
      .where(eq(viewPortfolioSummary.accountKey, accountKey))
      .limit(1);

    return NextResponse.json(portfolioSummary || null);
  } catch (error) {
    console.error("Failed to fetch portfolio summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio summary" },
      { status: 500 }
    );
  }
}