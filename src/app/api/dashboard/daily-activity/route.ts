import { db } from "@/lib/db/config";
import { viewDailyActivity } from "@/lib/db/schema";
import { getAccountKey } from "@/lib/supabase/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const accountKey = await getAccountKey();

    const dailyActivity = await db
      .select()
      .from(viewDailyActivity)
      .where(eq(viewDailyActivity.accountKey, accountKey));

    return NextResponse.json(dailyActivity);
  } catch (error) {
    console.error("Failed to fetch daily activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily activity" },
      { status: 500 },
    );
  }
}
