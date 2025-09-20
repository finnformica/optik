import dotenv from "dotenv";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "./schema";

dotenv.config();

if (!process.env.SUPABASE_DB_URL) {
  throw new Error("SUPABASE_DB_URL environment variable is not set");
}

// ---- Admin DB (service, bypasses RLS) ----
const adminClient: Sql = postgres(process.env.SUPABASE_DB_URL);
export const adminDb: PostgresJsDatabase<typeof schema> = drizzle(adminClient, {
  schema,
  casing: "snake_case",
});

// ---- User-scoped DB factory (RLS enforced) ----
export function getUserDb(
  userId: string | number
): PostgresJsDatabase<typeof schema> {
  const userClient: Sql = postgres(process.env.SUPABASE_DB_URL!, {
    // Intercept every connection and set role + user id
    onnotice: () => {}, // silence "SET" notices
    transform: postgres.camel,
  });

  // Immediately set config and role for this connection
  userClient`SET app.current_user_id = ${userId.toString()}`;
  userClient`SET ROLE authenticated`;

  return drizzle(userClient, { schema, casing: "snake_case" });
}

export const db = getUserDb(process.env.SUPABASE_DB_URL);
