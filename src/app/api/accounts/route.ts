import { getUserAccounts } from "@/lib/db/queries";
import { NextResponse } from "next/server";

export async function GET() {
  const accounts = await getUserAccounts();
  return NextResponse.json(accounts);
}
