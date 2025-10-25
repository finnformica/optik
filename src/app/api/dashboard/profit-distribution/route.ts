import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/config";
import { viewProfitDistribution } from "@/lib/db/schema";
import { getAccountKey } from "@/lib/supabase/server";

export async function GET() {
  try {
    const accountKey = await getAccountKey();

    const profitDistribution = await db
      .select()
      .from(viewProfitDistribution)
      .where(eq(viewProfitDistribution.accountKey, accountKey))
      .limit(20);

    return NextResponse.json(profitDistribution);
  } catch (error) {
    console.error("Failed to fetch profit distribution:", error);
    return NextResponse.json(
      { error: "Failed to fetch profit distribution" },
      { status: 500 }
    );
  }
}