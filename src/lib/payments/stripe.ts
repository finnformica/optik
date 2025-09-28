import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { endpoints, paths } from "../utils";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function createCheckoutSession({
  priceId,
  userId,
}: {
  priceId: string;
  userId: number;
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${process.env.BASE_URL}${endpoints.stripe.checkout}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}${paths.pricing}`,
    client_reference_id: userId.toString(),
    allow_promotion_codes: true,
    // Note: Trial period can be configured per-price in Stripe dashboard
    // subscription_data: {
    //   trial_period_days: 14,
    // },
  });

  redirect(session.url!);
}

export async function createCustomerPortalSession(stripeCustomerId: string) {
  if (!stripeCustomerId) {
    redirect(paths.pricing);
  }

  // Check if we have any existing configurations
  const configurations = await stripe.billingPortal.configurations.list();

  let configurationId: string | undefined;

  if (configurations.data.length === 0) {
    // Create a basic configuration if none exists
    const configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: "Manage your subscription",
      },
      features: {
        subscription_cancel: {
          enabled: true,
          mode: "at_period_end",
          cancellation_reason: {
            enabled: true,
            options: [
              "too_expensive",
              "missing_features",
              "switched_service",
              "unused",
              "other",
            ],
          },
        },
        payment_method_update: {
          enabled: true,
        },
        invoice_history: {
          enabled: true,
        },
      },
    });
    configurationId = configuration.id;
  } else {
    configurationId = configurations.data[0].id;
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${process.env.BASE_URL}/dashboard`,
    configuration: configurationId,
  });

  redirect(session.url);
}

export async function handleSubscriptionChange(
  subscription: Stripe.Subscription,
) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;

  // const team = await getTeamByStripeCustomerId(customerId);
  const team = null;

  if (!team) {
    console.error("Team not found for Stripe customer:", customerId);
    return;
  }

  if (status === "active" || status === "trialing") {
    const plan = subscription.items.data[0]?.plan;
    // await updateTeamSubscription(team.id, {
    //   stripeSubscriptionId: subscriptionId,
    //   stripeProductId: plan?.product as string,
    //   planName: (plan?.product as Stripe.Product).name,
    //   subscriptionStatus: status,
    // });
  } else if (status === "canceled" || status === "unpaid") {
    // await updateTeamSubscription(team.id, {
    //   stripeSubscriptionId: null,
    //   stripeProductId: null,
    //   planName: null,
    //   subscriptionStatus: status,
    // });
  }
}

export async function getStripePrices() {
  const prices = await stripe.prices.list({
    expand: ["data.product"],
    active: true,
    type: "recurring",
  });

  return prices.data.map((price) => ({
    id: price.id,
    productId:
      typeof price.product === "string" ? price.product : price.product.id,
    unitAmount: price.unit_amount,
    currency: price.currency,
    interval: price.recurring?.interval,
    trialPeriodDays: price.recurring?.trial_period_days,
  }));
}

export async function getStripeProducts() {
  const products = await stripe.products.list({
    active: true,
    expand: ["data.default_price"],
  });

  return products.data.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    defaultPriceId:
      typeof product.default_price === "string"
        ? product.default_price
        : product.default_price?.id,
  }));
}

// New functions that query from Supabase Stripe schema
export async function getStripePlans() {
  const supabase = await createClient();

  // Query prices and products separately since foreign key relationship isn't exposed
  const [pricesResult, productsResult] = await Promise.all([
    supabase
      .schema("stripe")
      .from("prices")
      .select(
        `
        id,
        product,
        unit_amount,
        currency,
        recurring,
        active,
        type
      `,
      )
      .eq("active", true)
      .eq("type", "recurring"),

    supabase
      .schema("stripe")
      .from("products")
      .select(
        `
        id,
        name,
        description,
        active
      `,
      )
      .eq("active", true),
  ]);

  if (pricesResult.error) {
    console.error("Error fetching prices from database:", pricesResult.error);
    throw new Error("Failed to fetch prices from database");
  }

  if (productsResult.error) {
    console.error(
      "Error fetching products from database:",
      productsResult.error,
    );
    throw new Error("Failed to fetch products from database");
  }

  // Create a map of products for easy lookup
  const productsMap = new Map(
    productsResult.data?.map((product: any) => [product.id, product]) || [],
  );

  return (
    pricesResult.data
      ?.map((price: any) => {
        const product = productsMap.get(price.product);
        return {
          id: price.id,
          productId: price.product,
          unitAmount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval,
          trialPeriodDays: price.recurring?.trial_period_days,
          product: product
            ? {
                id: product.id,
                name: product.name,
                description: product.description,
              }
            : null,
        };
      })
      .filter((price: any) => price.product !== null) || []
  ); // Only return prices with valid products
}
