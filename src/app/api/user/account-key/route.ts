import { getAccountKey } from "@/lib/supabase/server";

export async function GET() {
  try {
    const accountKey = await getAccountKey();
    return Response.json({ accountKey });
  } catch (error) {
    return Response.json({ accountKey: null }, { status: 401 });
  }
}