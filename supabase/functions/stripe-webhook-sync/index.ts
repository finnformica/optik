import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { StripeSync } from "npm:@supabase/stripe-sync-engine@0.45.0";

// Load secrets from environment variables
// For local DATABASE_URL use host.internal.docker instead of 127.0.0.1 to prevent connections being dropped
// E.g. postgresql://postgres:postgres@host.docker.internal:54322/postgres
const databaseUrl = Deno.env.get("DATABASE_URL")!;
const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;

// Initialize StripeSync
const stripeSync = new StripeSync({
  poolConfig: {
    connectionString: databaseUrl,
    max: 1,
    min: 0,
  },
  stripeWebhookSecret,
  stripeSecretKey,
  backfillRelatedEntities: false,
  autoExpandLists: true,
});

Deno.serve(async (req) => {
  // Extract raw body as Uint8Array (buffer)
  const rawBody = new Uint8Array(await req.arrayBuffer());

  const stripeSignature = req.headers.get("stripe-signature");

  await stripeSync.processWebhook(rawBody, stripeSignature);

  return new Response(null, {
    status: 202,
    headers: { "Content-Type": "application/json" },
  });
});
