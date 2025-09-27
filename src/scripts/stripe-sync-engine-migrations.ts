import { config } from "dotenv";
config();

import { runMigrations } from "@supabase/stripe-sync-engine";
(async () => {
  if (!process.env.SUPABASE_DB_URL) {
    throw new Error("SUPABASE_DB_URL is required");
  }

  await runMigrations({
    databaseUrl: process.env.SUPABASE_DB_URL,
    schema: "stripe",
    logger: console,
  });
})();
