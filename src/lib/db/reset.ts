// path to a file with schema you want to reset
import { reset } from "drizzle-seed";
import { db } from "./drizzle";
import * as schema from "./schema";


async function main() {
  console.log("Resetting database...");
  await reset(db, schema);

  console.log("\nDatabase reset successfully!\n");
}

main().catch(console.error);