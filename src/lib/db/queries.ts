import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { UserRole } from "@/types/user";
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
      const endTimestamp = subscription.cancel_at || subscription.current_period_end;
      const currentPeriodEnd = endTimestamp ? new Date(endTimestamp * 1000) : null;

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
export async function getUserSubscriptionInfo() {
  const user = await getUser();

  if (!user?.stripeCustomerId) {
    return {
      hasActiveSubscription: false,
      subscriptionStatus: null,
      planName: null,
      currentPeriodEnd: null,
    };
  }

  const supabase = await createClient();

  const { data: subscription } = await supabase
    .schema("stripe")
    .from("subscriptions")
    .select("status, current_period_end, canceled_at, cancel_at, plan")
    .eq("customer", user.stripeCustomerId)
    .eq("livemode", false) // Adjust based on your environment
    .order("created", { ascending: false })
    .limit(1)
    .single();

  if (!subscription) {
    return {
      hasActiveSubscription: false,
      subscriptionStatus: null,
      planName: null,
      currentPeriodEnd: null,
    };
  }

  // Get product name from the plan's product ID
  let planName = null;
  if (subscription.plan) {
    try {
      const planData = typeof subscription.plan === 'string'
        ? JSON.parse(subscription.plan)
        : subscription.plan;

      if (planData?.product) {
        const { data: product } = await supabase
          .schema("stripe")
          .from("products")
          .select("name")
          .eq("id", planData.product)
          .single();

        planName = product?.name || null;
      }
    } catch (error) {
      console.error("Error parsing plan JSON:", error);
    }
  }

  // Determine the actual end date - use cancel_at for canceled subscriptions, otherwise current_period_end
  const endTimestamp = subscription.cancel_at || subscription.current_period_end;
  const currentPeriodEnd = endTimestamp ? new Date(endTimestamp * 1000) : null;

  const isActive =
    subscription.status === "active" || subscription.status === "trialing";
  const isInPaidPeriod =
    subscription.status === "canceled" &&
    currentPeriodEnd &&
    currentPeriodEnd > new Date();

  return {
    hasActiveSubscription: isActive || isInPaidPeriod,
    subscriptionStatus: subscription.status,
    planName,
    currentPeriodEnd,
  };
}
