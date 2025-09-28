"use server";

import { getUser } from "@/lib/db/queries";
import { createCheckoutSession } from "@/lib/payments/stripe";
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
  // TODO: Implement customer portal action
  throw new Error("Customer portal not implemented yet");
};
