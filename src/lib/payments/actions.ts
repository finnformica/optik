"use server";

import { getUser } from "@/lib/db/queries";
import { createCheckoutSession, createCustomerPortalSession } from "@/lib/payments/stripe";
import { paths } from "@/lib/utils";
import { redirect } from "next/navigation";

export const checkoutAction = async (formData: FormData) => {
  const priceId = formData.get("priceId") as string;

  if (!priceId) {
    throw new Error("Price ID is required");
  }

  // Get the current user
  const user = await getUser();
  if (!user) {
    // Redirect to sign in with the pricing page as return URL
    redirect(`/sign-in?redirect=/pricing`);
  }

  // Create checkout session and redirect
  await createCheckoutSession({
    priceId,
    userId: user.id,
  });
};

export const customerPortalAction = async () => {
  // Get the current user
  const user = await getUser();
  if (!user) {
    redirect(`${paths.auth.signIn}?redirect=/settings`);
  }

  // Check if user has a Stripe customer ID
  if (!user.stripeCustomerId) {
    throw new Error("No subscription found. Please subscribe to a plan first.");
  }

  // Create customer portal session and redirect
  await createCustomerPortalSession(user.stripeCustomerId);
};
