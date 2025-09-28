import { getUserSubscriptionInfo } from "@/lib/db/queries";

export async function GET() {
  const subscriptionInfo = await getUserSubscriptionInfo();
  return Response.json(subscriptionInfo);
}