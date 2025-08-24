CREATE TYPE "public"."broker" AS ENUM('schwab', 'robinhood', 'etrade', 'fidelity', 'tda', 'vanguard');--> statement-breakpoint
CREATE TYPE "public"."transaction_action" AS ENUM('buy', 'sell', 'buy_to_open', 'sell_to_close', 'sell_to_open', 'buy_to_close', 'dividend', 'interest', 'transfer');--> statement-breakpoint
ALTER TABLE "user_access_tokens" RENAME COLUMN "provider" TO "broker";--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "broker" SET DATA TYPE "public"."broker" USING "broker"::"public"."broker";--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "action" SET DATA TYPE "public"."transaction_action" USING "action"::"public"."transaction_action";--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "transaction_id" bigint;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_transaction_id_unique" UNIQUE("transaction_id");