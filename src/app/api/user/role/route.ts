import { getUserRole } from "@/lib/db/queries";

export async function GET() {
  const role = await getUserRole();
  return Response.json(role);
}