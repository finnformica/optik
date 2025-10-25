import { db } from "@/lib/db/config";
import { viewPortfolioDistribution } from "@/lib/db/schema";
import { getAccountKey } from "@/lib/supabase/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const accountKey = await getAccountKey();

    const distribution = await db
      .select()
      .from(viewPortfolioDistribution)
      .where(eq(viewPortfolioDistribution.accountKey, accountKey))
      .limit(20);

    return NextResponse.json(distribution);
  } catch (error) {
    console.error("Failed to fetch portfolio distribution:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio distribution" },
      { status: 500 },
    );
  }
}
