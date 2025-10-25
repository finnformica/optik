import { db } from "@/lib/db/config";
import { viewWeeklyReturn } from "@/lib/db/schema";
import { getAccountKey } from "@/lib/supabase/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const accountKey = await getAccountKey();

    const weeklyReturns = await db
      .select()
      .from(viewWeeklyReturn)
      .where(eq(viewWeeklyReturn.accountKey, accountKey))
      .limit(52);

    return NextResponse.json(weeklyReturns);
  } catch (error) {
    console.error("Failed to fetch weekly returns:", error);
    return NextResponse.json(
      { error: "Failed to fetch weekly returns" },
      { status: 500 },
    );
  }
}
