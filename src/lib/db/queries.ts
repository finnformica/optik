import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { UserRole, UserSubscription } from "@/types/user";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "./config";
import { dimAccount, dimUser } from "./schema";

export async function getUser() {
  try {
    const supabaseUser = await getAuthenticatedUser();

    const [user] = await db
      .select()
      .from(dimUser)
      .where(
        and(eq(dimUser.email, supabaseUser.email!), isNull(dimUser.deletedAt)),
      )
      .limit(1);

    return user || null;
  } catch {
    return null;
  }
}

export async function getUserAccounts() {
  const user = await getUser();
  if (!user) return [];

  const accounts = await db
    .select()
    .from(dimAccount)
    .where(and(eq(dimAccount.userId, user.id), eq(dimAccount.isActive, true)))
    .orderBy(asc(dimAccount.accountKey));

  return accounts;
}

export async function getUserRole(): Promise<UserRole> {
  const user = await getUser();
  if (!user) return "basic"; // Default to basic if no user

  // Check for role override first
  if (
    user.roleOverride === "basic" ||
    user.roleOverride === "pro" ||
    user.roleOverride === "admin"
  ) {
    return user.roleOverride;
  }

  // If no override, check Stripe subscription status
  if (user.stripeCustomerId) {
    const supabase = await createClient();

    const { data: subscription } = await supabase
      .schema("stripe")
      .from("subscriptions")
      .select("status, current_period_end, canceled_at, cancel_at")
      .eq("customer", user.stripeCustomerId)
      .eq("livemode", false) // Adjust based on your environment
      .order("created", { ascending: false })
      .limit(1)
      .single();

    if (subscription) {
      // Use cancel_at for canceled subscriptions, otherwise current_period_end
      const endTimestamp =
        subscription.cancel_at || subscription.current_period_end;
      const currentPeriodEnd = endTimestamp
        ? new Date(endTimestamp * 1000)
        : null;

      const isActive =
        subscription.status === "active" || subscription.status === "trialing";
      const isInPaidPeriod =
        subscription.status === "canceled" &&
        currentPeriodEnd &&
        currentPeriodEnd > new Date();

      if (isActive || isInPaidPeriod) {
        return "pro";
      }
    }
  }

  return "basic";
}

// Helper function to get account limits based on role
export function getAccountLimitForRole(role: UserRole): number {
  switch (role) {
    case "basic":
      return 1;
    case "pro":
      return 5;
    case "admin":
      return Infinity;
    default:
      return 1; // Default to basic limit
  }
}

// Get subscription information from Stripe schema
export async function getUserSubscriptionInfo(): Promise<UserSubscription> {
  const user = await getUser();
  const role = await getUserRole();

  const defaultInfo: UserSubscription = {
    role,
    hasActiveSubscription: false,
    subscriptionStatus: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  };

  if (!user?.stripeCustomerId) return defaultInfo;

  const supabase = await createClient();

  const { data: subscription } = await supabase
    .schema("stripe")
    .from("subscriptions")
    .select("status, canceled_at, cancel_at, cancel_at_period_end, plan, items")
    .eq("customer", user.stripeCustomerId)
    .order("created", { ascending: false })
    .limit(1)
    .single();

  if (!subscription) return defaultInfo;

  // Extract current_period_end from items data
  let currentPeriodEndTimestamp = null;
  if (subscription.items?.data?.[0]?.current_period_end) {
    currentPeriodEndTimestamp = subscription.items.data[0].current_period_end;
  }

  // Determine the actual end date - use cancel_at for canceled subscriptions, otherwise current_period_end from items
  const endTimestamp = subscription.cancel_at || currentPeriodEndTimestamp;
  const currentPeriodEnd = endTimestamp ? new Date(endTimestamp * 1000) : null;

  const isActive =
    subscription.status === "active" || subscription.status === "trialing";
  const isInPaidPeriod =
    subscription.status === "canceled" &&
    currentPeriodEnd &&
    currentPeriodEnd > new Date();

  return {
    role,
    hasActiveSubscription: isActive || isInPaidPeriod || false,
    subscriptionStatus: subscription.status,
    currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
  };
}
