import { getTutorialStructure } from "@/app/(dashboard)/help/actions";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const tutorials = await getTutorialStructure();
    return NextResponse.json(tutorials);
  } catch (error) {
    console.error("Error fetching tutorials:", error);
    return NextResponse.json([], { status: 500 });
  }
}
