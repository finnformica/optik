import { db } from "@/lib/db/config";
import { dimUser } from "@/lib/db/schema";
import { stripe } from "@/lib/payments/stripe";
import { paths } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.redirect(new URL(paths.pricing, request.url));
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["customer", "subscription"],
    });

    if (!session.customer || typeof session.customer === "string") {
      throw new Error("Invalid customer data from Stripe.");
    }

    const customerId = session.customer.id;
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;

    if (!subscriptionId) {
      throw new Error("No subscription found for this session.");
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data.price.product"],
    });

    const plan = subscription.items.data[0]?.price;

    if (!plan) {
      throw new Error("No plan found for this subscription.");
    }

    const productId = (plan.product as Stripe.Product).id;

    if (!productId) {
      throw new Error("No product ID found for this subscription.");
    }

    const userId = session.client_reference_id;
    if (!userId) {
      throw new Error("No user ID found in session's client_reference_id.");
    }

    const [user] = await db
      .select()
      .from(dimUser)
      .where(eq(dimUser.id, Number(userId)))
      .limit(1);

    if (!user) {
      throw new Error("User not found in database.");
    }

    // Update user subscription data - this will automatically compute the role
    await db
      .update(dimUser)
      .set({
        stripeCustomerId: customerId,
        updatedAt: new Date(),
      })
      .where(eq(dimUser.id, Number(userId)));

    return NextResponse.redirect(new URL(paths.dashboard, request.url));
  } catch (error) {
    console.error("Error handling successful checkout:", error);
    return NextResponse.redirect(new URL(paths.error, request.url));
  }
}
