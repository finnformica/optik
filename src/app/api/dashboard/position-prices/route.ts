import {
  getPositionPrices,
  type Position,
} from "@/app/(dashboard)/dashboard/actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { positions }: { positions: Position[] } = body;

    if (!Array.isArray(positions)) {
      return NextResponse.json(
        { error: "Invalid positions data" },
        { status: 400 },
      );
    }

    const enrichedPositions = await getPositionPrices(positions);

    return NextResponse.json(enrichedPositions);
  } catch (error) {
    console.error("Failed to fetch position prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch position prices" },
      { status: 500 },
    );
  }
}
