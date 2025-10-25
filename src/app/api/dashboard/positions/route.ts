import { db } from "@/lib/db/config";
import { viewCurrentPosition } from "@/lib/db/schema";
import { getAccountKey } from "@/lib/supabase/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const accountKey = await getAccountKey();

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

    return NextResponse.json(positions);
  } catch (error) {
    console.error("Failed to fetch positions:", error);
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 },
    );
  }
}
