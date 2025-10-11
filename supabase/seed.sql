

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "drizzle";


ALTER SCHEMA "drizzle" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "stripe";


ALTER SCHEMA "stripe" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "stripe"."invoice_status" AS ENUM (
    'draft',
    'open',
    'paid',
    'uncollectible',
    'void',
    'deleted'
);


ALTER TYPE "stripe"."invoice_status" OWNER TO "postgres";


CREATE TYPE "stripe"."pricing_tiers" AS ENUM (
    'graduated',
    'volume'
);


ALTER TYPE "stripe"."pricing_tiers" OWNER TO "postgres";


CREATE TYPE "stripe"."pricing_type" AS ENUM (
    'one_time',
    'recurring'
);


ALTER TYPE "stripe"."pricing_type" OWNER TO "postgres";


CREATE TYPE "stripe"."subscription_schedule_status" AS ENUM (
    'not_started',
    'active',
    'completed',
    'released',
    'canceled'
);


ALTER TYPE "stripe"."subscription_schedule_status" OWNER TO "postgres";


CREATE TYPE "stripe"."subscription_status" AS ENUM (
    'trialing',
    'active',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'past_due',
    'unpaid',
    'paused'
);


ALTER TYPE "stripe"."subscription_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_user_deletion"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  BEGIN
    -- When a user is marked as deleted in dim_user, soft delete them in auth.users
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      UPDATE auth.users
      SET deleted_at = NEW.deleted_at
      WHERE id = NEW.auth_user_id;
    END IF;

    RETURN NEW;
  END;
  $$;


ALTER FUNCTION "public"."handle_user_deletion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return NEW;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
    "id" integer NOT NULL,
    "hash" "text" NOT NULL,
    "created_at" bigint
);


ALTER TABLE "drizzle"."__drizzle_migrations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "drizzle"."__drizzle_migrations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "drizzle"."__drizzle_migrations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "drizzle"."__drizzle_migrations_id_seq" OWNED BY "drizzle"."__drizzle_migrations"."id";



CREATE TABLE IF NOT EXISTS "public"."dim_account" (
    "account_key" integer NOT NULL,
    "user_id" integer NOT NULL,
    "account_name" character varying(100) DEFAULT 'Primary Account'::character varying,
    "account_type" character varying(50) DEFAULT 'INDIVIDUAL'::character varying,
    "currency" character varying(3) DEFAULT 'USD'::character varying,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."dim_account" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dim_account_access_token" (
    "access_token_key" integer NOT NULL,
    "account_key" integer NOT NULL,
    "encrypted_tokens" "text" NOT NULL,
    "expires_at" timestamp without time zone NOT NULL,
    "token_type" character varying(50) NOT NULL,
    "scope" character varying(255) NOT NULL,
    "broker_code" character varying(20) NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."dim_account_access_token" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."dim_account_access_tokens_access_token_key_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."dim_account_access_tokens_access_token_key_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."dim_account_access_tokens_access_token_key_seq" OWNED BY "public"."dim_account_access_token"."access_token_key";



CREATE SEQUENCE IF NOT EXISTS "public"."dim_account_account_key_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."dim_account_account_key_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."dim_account_account_key_seq" OWNED BY "public"."dim_account"."account_key";



CREATE TABLE IF NOT EXISTS "public"."dim_broker" (
    "broker_key" integer NOT NULL,
    "broker_code" character varying(20) NOT NULL,
    "broker_name" character varying(100),
    "commission_structure" character varying(100),
    "api_provider" character varying(50),
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."dim_broker" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dim_broker_account" (
    "broker_account_key" integer NOT NULL,
    "account_key" integer NOT NULL,
    "broker_key" integer NOT NULL,
    "broker_account_number" character varying(50) NOT NULL,
    "broker_account_hash" character varying(100) NOT NULL,
    "broker_account_type" character varying(50),
    "is_active" boolean DEFAULT true,
    "last_synced_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."dim_broker_account" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."dim_broker_accounts_broker_account_key_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."dim_broker_accounts_broker_account_key_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."dim_broker_accounts_broker_account_key_seq" OWNED BY "public"."dim_broker_account"."broker_account_key";



CREATE SEQUENCE IF NOT EXISTS "public"."dim_broker_broker_key_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."dim_broker_broker_key_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."dim_broker_broker_key_seq" OWNED BY "public"."dim_broker"."broker_key";



CREATE TABLE IF NOT EXISTS "public"."dim_date" (
    "date_key" integer NOT NULL,
    "full_date" "date" NOT NULL,
    "day_of_week" character varying(10),
    "day_of_month" integer,
    "week_of_year" integer,
    "month_name" character varying(10),
    "month_number" integer,
    "quarter" integer,
    "year" integer,
    "is_weekend" boolean,
    "is_trading_day" boolean,
    "week_ending_date" "date",
    "month_ending_date" "date",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "week_starting_date" "date"
);


ALTER TABLE "public"."dim_date" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dim_security" (
    "security_key" integer NOT NULL,
    "symbol" character varying(50) NOT NULL,
    "security_type" character varying(20) NOT NULL,
    "option_type" character varying(10),
    "strike_price" numeric(18,8),
    "expiry_date" "date",
    "security_name" "text",
    "underlying_symbol" character varying(50) NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "check_stock_option" CHECK ((((("security_type")::"text" = 'STOCK'::"text") AND (("underlying_symbol")::"text" = ("symbol")::"text") AND ("option_type" IS NULL) AND ("strike_price" IS NULL) AND ("expiry_date" IS NULL)) OR ((("security_type")::"text" = 'OPTION'::"text") AND (("underlying_symbol")::"text" <> ("symbol")::"text") AND ("option_type" IS NOT NULL) AND ("strike_price" IS NOT NULL) AND ("expiry_date" IS NOT NULL))))
);


ALTER TABLE "public"."dim_security" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."dim_security_security_key_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."dim_security_security_key_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."dim_security_security_key_seq" OWNED BY "public"."dim_security"."security_key";



CREATE TABLE IF NOT EXISTS "public"."dim_time" (
    "time_key" integer NOT NULL,
    "time_value" character varying(8) NOT NULL,
    "hour" integer NOT NULL,
    "minute" integer NOT NULL,
    "second" integer NOT NULL,
    "hour_minute" character varying(5) NOT NULL,
    "period_of_day" character varying(20),
    "is_market_hours" boolean DEFAULT false,
    "quarter_hour" integer NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."dim_time" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."dim_time_time_key_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."dim_time_time_key_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."dim_time_time_key_seq" OWNED BY "public"."dim_time"."time_key";



CREATE TABLE IF NOT EXISTS "public"."dim_transaction_type" (
    "transaction_type_key" integer NOT NULL,
    "action_code" character varying(20) NOT NULL,
    "action_description" character varying(100),
    "action_category" character varying(50),
    "affects_position" boolean,
    "direction" integer,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."dim_transaction_type" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."dim_transaction_type_transaction_type_key_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."dim_transaction_type_transaction_type_key_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."dim_transaction_type_transaction_type_key_seq" OWNED BY "public"."dim_transaction_type"."transaction_type_key";



CREATE TABLE IF NOT EXISTS "public"."dim_user" (
    "id" integer NOT NULL,
    "first_name" character varying(100),
    "email" character varying(255) NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp without time zone,
    "last_name" character varying(50),
    "auth_user_id" "uuid",
    "stripe_customer_id" character varying(255),
    "role_override" character varying(20),
    "onboarding_completed" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."dim_user" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fact_stock_prices" (
    "id" integer NOT NULL,
    "symbol" character varying(20) NOT NULL,
    "date_key" integer NOT NULL,
    "quarter_hour" integer NOT NULL,
    "price" numeric(18,8) NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."fact_stock_prices" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."fact_stock_prices_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."fact_stock_prices_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."fact_stock_prices_id_seq" OWNED BY "public"."fact_stock_prices"."id";



CREATE TABLE IF NOT EXISTS "public"."fact_transaction" (
    "date_key" integer NOT NULL,
    "account_key" integer NOT NULL,
    "security_key" integer,
    "transaction_type_key" integer NOT NULL,
    "broker_key" integer NOT NULL,
    "broker_transaction_id" character varying(50) NOT NULL,
    "order_id" character varying(50),
    "original_transaction_id" integer,
    "quantity" numeric(18,8) NOT NULL,
    "price_per_unit" numeric(18,8),
    "gross_amount" numeric(18,8) NOT NULL,
    "fees" numeric(18,8) DEFAULT '0'::numeric NOT NULL,
    "net_amount" numeric(18,8) NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "description" "text",
    "transaction_key" integer NOT NULL,
    "time_key" integer NOT NULL
);


ALTER TABLE "public"."fact_transaction" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."fact_transactions_transaction_key_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."fact_transactions_transaction_key_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."fact_transactions_transaction_key_seq" OWNED BY "public"."fact_transaction"."transaction_key";



CREATE TABLE IF NOT EXISTS "public"."stg_transaction" (
    "id" integer NOT NULL,
    "broker_code" character varying(20) NOT NULL,
    "broker_transaction_id" character varying(50) NOT NULL,
    "raw_data" "jsonb" NOT NULL,
    "status" character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    "error_message" "text",
    "broker_timestamp" timestamp without time zone NOT NULL,
    "processed_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "account_key" integer NOT NULL,
    "data_source" character varying(10) DEFAULT 'api'::character varying NOT NULL
);


ALTER TABLE "public"."stg_transaction" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."raw_transactions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."raw_transactions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."raw_transactions_id_seq" OWNED BY "public"."stg_transaction"."id";



CREATE TABLE IF NOT EXISTS "public"."rtm_sync_progress" (
    "id" integer NOT NULL,
    "account_key" integer NOT NULL,
    "status" character varying(20) NOT NULL,
    "progress" integer DEFAULT 0 NOT NULL,
    "total" integer DEFAULT 0 NOT NULL,
    "processed" integer DEFAULT 0 NOT NULL,
    "failed" integer DEFAULT 0 NOT NULL,
    "remaining" integer DEFAULT 0 NOT NULL,
    "start_time" timestamp without time zone NOT NULL,
    "end_time" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rtm_sync_progress" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."rtm_sync_progress_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."rtm_sync_progress_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."rtm_sync_progress_id_seq" OWNED BY "public"."rtm_sync_progress"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."users_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."users_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."users_id_seq" OWNED BY "public"."dim_user"."id";



CREATE OR REPLACE VIEW "public"."view_stock_profit" WITH ("security_invoker"='true') AS
 WITH "stock_transactions" AS (
         SELECT "ft"."transaction_key",
            "ft"."account_key",
            "ds"."symbol",
            "ds"."underlying_symbol",
            "d"."full_date" AS "transaction_date",
            "tt"."action_code" AS "transaction_type",
            "ft"."quantity",
            "ft"."price_per_unit",
            "ft"."net_amount",
            "row_number"() OVER (PARTITION BY "ft"."account_key", "ds"."symbol" ORDER BY "d"."full_date", "ft"."transaction_key") AS "transaction_sequence"
           FROM ((("public"."fact_transaction" "ft"
             JOIN "public"."dim_security" "ds" ON (("ft"."security_key" = "ds"."security_key")))
             JOIN "public"."dim_date" "d" ON (("ft"."date_key" = "d"."date_key")))
             JOIN "public"."dim_transaction_type" "tt" ON (("ft"."transaction_type_key" = "tt"."transaction_type_key")))
          WHERE ((("ds"."security_type")::"text" = 'STOCK'::"text") AND (("tt"."action_category")::"text" = 'TRADE'::"text"))
        ), "running_calculations" AS (
         SELECT "st"."transaction_key",
            "st"."account_key",
            "st"."symbol",
            "st"."underlying_symbol",
            "st"."transaction_date",
            "st"."transaction_type",
            "st"."quantity",
            "st"."price_per_unit",
            "st"."net_amount",
            "st"."transaction_sequence",
            "sum"("st"."quantity") OVER (PARTITION BY "st"."account_key", "st"."symbol" ORDER BY "st"."transaction_sequence" ROWS UNBOUNDED PRECEDING) AS "running_quantity",
                CASE
                    WHEN ("sum"("st"."quantity") OVER (PARTITION BY "st"."account_key", "st"."symbol" ORDER BY "st"."transaction_sequence" ROWS UNBOUNDED PRECEDING) > (0)::numeric) THEN ("sum"("st"."quantity") OVER (PARTITION BY "st"."account_key", "st"."symbol" ORDER BY "st"."transaction_sequence" ROWS UNBOUNDED PRECEDING) * ("sum"(
                    CASE
                        WHEN ("st"."quantity" > (0)::numeric) THEN "abs"("st"."net_amount")
                        ELSE (0)::numeric
                    END) OVER (PARTITION BY "st"."account_key", "st"."symbol" ORDER BY "st"."transaction_sequence" ROWS UNBOUNDED PRECEDING) / NULLIF("sum"(
                    CASE
                        WHEN ("st"."quantity" > (0)::numeric) THEN "st"."quantity"
                        ELSE (0)::numeric
                    END) OVER (PARTITION BY "st"."account_key", "st"."symbol" ORDER BY "st"."transaction_sequence" ROWS UNBOUNDED PRECEDING), (0)::numeric)))
                    ELSE (0)::numeric
                END AS "running_cost_basis",
                CASE
                    WHEN ("sum"(
                    CASE
                        WHEN ("st"."quantity" > (0)::numeric) THEN "st"."quantity"
                        ELSE (0)::numeric
                    END) OVER (PARTITION BY "st"."account_key", "st"."symbol" ORDER BY "st"."transaction_sequence" ROWS UNBOUNDED PRECEDING) > (0)::numeric) THEN ("sum"(
                    CASE
                        WHEN ("st"."quantity" > (0)::numeric) THEN "abs"("st"."net_amount")
                        ELSE (0)::numeric
                    END) OVER (PARTITION BY "st"."account_key", "st"."symbol" ORDER BY "st"."transaction_sequence" ROWS UNBOUNDED PRECEDING) / "sum"(
                    CASE
                        WHEN ("st"."quantity" > (0)::numeric) THEN "st"."quantity"
                        ELSE (0)::numeric
                    END) OVER (PARTITION BY "st"."account_key", "st"."symbol" ORDER BY "st"."transaction_sequence" ROWS UNBOUNDED PRECEDING))
                    ELSE (0)::numeric
                END AS "avg_cost_per_share"
           FROM "stock_transactions" "st"
        ), "profit_calculations" AS (
         SELECT "rc"."transaction_key",
            "rc"."account_key",
            "rc"."symbol",
            "rc"."underlying_symbol",
            "rc"."transaction_date",
            "rc"."transaction_type",
            "rc"."quantity",
            "rc"."price_per_unit",
            "rc"."net_amount",
            "rc"."transaction_sequence",
            "rc"."running_quantity",
            "rc"."running_cost_basis",
            "rc"."avg_cost_per_share",
                CASE
                    WHEN ("rc"."quantity" < (0)::numeric) THEN ((("abs"("rc"."net_amount") / "abs"("rc"."quantity")) * "abs"("rc"."quantity")) - ("rc"."avg_cost_per_share" * "abs"("rc"."quantity")))
                    ELSE (0)::numeric
                END AS "realized_profit"
           FROM "running_calculations" "rc"
        )
 SELECT "account_key",
    "symbol",
    "underlying_symbol",
    "transaction_date",
    "transaction_key",
    "transaction_type",
    "quantity",
    "price_per_unit",
    "net_amount",
    "running_quantity",
    "running_cost_basis",
    "avg_cost_per_share",
    "realized_profit",
    "sum"("realized_profit") OVER (PARTITION BY "account_key", "symbol" ORDER BY "transaction_sequence" ROWS UNBOUNDED PRECEDING) AS "cumulative_realized_profit"
   FROM "profit_calculations" "pc"
  ORDER BY "account_key", "symbol", "transaction_sequence";


ALTER VIEW "public"."view_stock_profit" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."view_weekly_position" WITH ("security_invoker"='true') AS
 WITH "weekly_date_series" AS (
         SELECT DISTINCT "d"."week_starting_date" AS "week_start",
            "ft"."account_key"
           FROM (("public"."fact_transaction" "ft"
             JOIN "public"."dim_date" "d" ON (("ft"."date_key" = "d"."date_key")))
             JOIN "public"."dim_account" "a" ON (("ft"."account_key" = "a"."account_key")))
          WHERE ("a"."is_active" = true)
        ), "non_stock_positions" AS (
         SELECT "wds"."account_key",
            "wds"."week_start",
            "ds"."symbol",
            "ds"."security_type",
            "ds"."underlying_symbol",
            "sum"("ft"."quantity") AS "cumulative_quantity",
                CASE
                    WHEN ("sum"("abs"("ft"."quantity")) > (0)::numeric) THEN ("sum"("abs"("ft"."net_amount")) / "sum"("abs"("ft"."quantity")))
                    ELSE (0)::numeric
                END AS "avg_cost_per_unit",
            "min"("d"."full_date") AS "first_transaction_date",
            "max"("d"."full_date") AS "last_transaction_date",
            "ds"."expiry_date",
            "ds"."option_type",
            "ds"."strike_price"
           FROM (((("weekly_date_series" "wds"
             JOIN "public"."fact_transaction" "ft" ON (("ft"."account_key" = "wds"."account_key")))
             JOIN "public"."dim_date" "d" ON (("ft"."date_key" = "d"."date_key")))
             JOIN "public"."dim_security" "ds" ON (("ft"."security_key" = "ds"."security_key")))
             JOIN "public"."dim_transaction_type" "tt" ON (("ft"."transaction_type_key" = "tt"."transaction_type_key")))
          WHERE (("d"."week_starting_date" <= "wds"."week_start") AND (("tt"."action_category")::"text" = ANY ((ARRAY['TRADE'::character varying, 'CORPORATE'::character varying])::"text"[])) AND (("ds"."security_type")::"text" <> 'STOCK'::"text"))
          GROUP BY "wds"."account_key", "wds"."week_start", "ds"."symbol", "ds"."security_type", "ds"."underlying_symbol", "ds"."expiry_date", "ds"."option_type", "ds"."strike_price"
         HAVING ("sum"("ft"."quantity") <> (0)::numeric)
        ), "stock_positions" AS (
         SELECT "wds"."account_key",
            "wds"."week_start",
            "vsp"."symbol",
            'STOCK'::character varying(20) AS "security_type",
            "vsp"."underlying_symbol",
            ( SELECT "vsp2"."running_quantity"
                   FROM ("public"."view_stock_profit" "vsp2"
                     JOIN "public"."dim_date" "d2" ON (("vsp2"."transaction_date" = "d2"."full_date")))
                  WHERE (("vsp2"."account_key" = "wds"."account_key") AND (("vsp2"."symbol")::"text" = ("vsp"."symbol")::"text") AND ("d2"."week_starting_date" <= "wds"."week_start"))
                  ORDER BY "vsp2"."transaction_date" DESC, "vsp2"."transaction_key" DESC
                 LIMIT 1) AS "cumulative_quantity",
            ( SELECT "vsp2"."avg_cost_per_share"
                   FROM ("public"."view_stock_profit" "vsp2"
                     JOIN "public"."dim_date" "d2" ON (("vsp2"."transaction_date" = "d2"."full_date")))
                  WHERE (("vsp2"."account_key" = "wds"."account_key") AND (("vsp2"."symbol")::"text" = ("vsp"."symbol")::"text") AND ("d2"."week_starting_date" <= "wds"."week_start"))
                  ORDER BY "vsp2"."transaction_date" DESC, "vsp2"."transaction_key" DESC
                 LIMIT 1) AS "avg_cost_per_unit",
            "min"("vsp"."transaction_date") AS "first_transaction_date",
            "max"("vsp"."transaction_date") AS "last_transaction_date",
            NULL::"text" AS "expiry_date",
            NULL::"text" AS "option_type",
            NULL::"text" AS "strike_price"
           FROM (("weekly_date_series" "wds"
             JOIN "public"."view_stock_profit" "vsp" ON (("vsp"."account_key" = "wds"."account_key")))
             JOIN "public"."dim_date" "d" ON (("vsp"."transaction_date" = "d"."full_date")))
          WHERE ("d"."week_starting_date" <= "wds"."week_start")
          GROUP BY "wds"."account_key", "wds"."week_start", "vsp"."symbol", "vsp"."underlying_symbol"
         HAVING (( SELECT "vsp2"."running_quantity"
                   FROM ("public"."view_stock_profit" "vsp2"
                     JOIN "public"."dim_date" "d2" ON (("vsp2"."transaction_date" = "d2"."full_date")))
                  WHERE (("vsp2"."account_key" = "wds"."account_key") AND (("vsp2"."symbol")::"text" = ("vsp"."symbol")::"text") AND ("d2"."week_starting_date" <= "wds"."week_start"))
                  ORDER BY "vsp2"."transaction_date" DESC, "vsp2"."transaction_key" DESC
                 LIMIT 1) > (0)::numeric)
        )
 SELECT COALESCE("nsp"."account_key", "sp"."account_key") AS "account_key",
    COALESCE("nsp"."week_start", "sp"."week_start") AS "week_start",
    COALESCE("nsp"."symbol", "sp"."symbol") AS "symbol",
    COALESCE("nsp"."security_type", "sp"."security_type") AS "security_type",
    COALESCE("nsp"."underlying_symbol", "sp"."underlying_symbol") AS "underlying_symbol",
    COALESCE("nsp"."cumulative_quantity", "sp"."cumulative_quantity") AS "quantity",
    COALESCE("nsp"."avg_cost_per_unit", "sp"."avg_cost_per_unit") AS "avg_cost_per_unit",
    COALESCE("nsp"."first_transaction_date", "sp"."first_transaction_date") AS "first_transaction_date",
    COALESCE("nsp"."last_transaction_date", "sp"."last_transaction_date") AS "last_transaction_date",
        CASE
            WHEN ((COALESCE("nsp"."security_type", "sp"."security_type"))::"text" = 'STOCK'::"text") THEN ("abs"(COALESCE("sp"."cumulative_quantity", (0)::numeric)) * COALESCE("sp"."avg_cost_per_unit", (0)::numeric))
            WHEN ((("nsp"."security_type")::"text" = 'OPTION'::"text") AND (("nsp"."option_type")::"text" = 'PUT'::"text") AND ("nsp"."cumulative_quantity" < (0)::numeric)) THEN (("abs"("nsp"."cumulative_quantity") * "nsp"."strike_price") * (100)::numeric)
            WHEN ((("nsp"."security_type")::"text" = 'OPTION'::"text") AND (("nsp"."option_type")::"text" = 'PUT'::"text") AND ("nsp"."cumulative_quantity" > (0)::numeric)) THEN (0)::numeric
            WHEN ((("nsp"."security_type")::"text" = 'OPTION'::"text") AND (("nsp"."option_type")::"text" = 'CALL'::"text") AND ("nsp"."cumulative_quantity" > (0)::numeric)) THEN (("abs"("nsp"."cumulative_quantity") * "nsp"."strike_price") * (100)::numeric)
            WHEN ((("nsp"."security_type")::"text" = 'OPTION'::"text") AND (("nsp"."option_type")::"text" = 'CALL'::"text") AND ("nsp"."cumulative_quantity" < (0)::numeric)) THEN (0)::numeric
            ELSE ("abs"(COALESCE("nsp"."cumulative_quantity", (0)::numeric)) * COALESCE("nsp"."avg_cost_per_unit", (0)::numeric))
        END AS "position_value",
    'OPEN'::"text" AS "position_status",
    0 AS "unrealized_pnl",
    "nsp"."expiry_date",
    "nsp"."option_type",
    "nsp"."strike_price"
   FROM ("non_stock_positions" "nsp"
     FULL JOIN "stock_positions" "sp" ON ((("nsp"."account_key" = "sp"."account_key") AND ("nsp"."week_start" = "sp"."week_start") AND (("nsp"."symbol")::"text" = ("sp"."symbol")::"text"))))
  ORDER BY COALESCE("nsp"."account_key", "sp"."account_key"), COALESCE("nsp"."week_start", "sp"."week_start"), COALESCE("nsp"."symbol", "sp"."symbol");


ALTER VIEW "public"."view_weekly_position" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."view_weekly_portfolio_value" WITH ("security_invoker"='true') AS
 WITH "weekly_date_series" AS (
         SELECT DISTINCT "view_weekly_position"."week_start",
            "view_weekly_position"."account_key"
           FROM "public"."view_weekly_position"
        ), "weekly_cash_flows" AS (
         SELECT "wds"."account_key",
            "wds"."week_start",
            COALESCE("sum"("ft"."net_amount"), (0)::numeric) AS "cash_flows_to_date"
           FROM (("weekly_date_series" "wds"
             LEFT JOIN "public"."fact_transaction" "ft" ON (("ft"."account_key" = "wds"."account_key")))
             LEFT JOIN "public"."dim_date" "d" ON (("ft"."date_key" = "d"."date_key")))
          WHERE (("d"."week_starting_date" <= "wds"."week_start") OR ("ft"."transaction_key" IS NULL))
          GROUP BY "wds"."account_key", "wds"."week_start"
        ), "weekly_transfers" AS (
         SELECT "wds"."account_key",
            "wds"."week_start",
            COALESCE("sum"(
                CASE
                    WHEN (("tt"."action_category")::"text" = 'TRANSFER'::"text") THEN "ft"."net_amount"
                    ELSE (0)::numeric
                END), (0)::numeric) AS "cumulative_transfers"
           FROM ((("weekly_date_series" "wds"
             LEFT JOIN "public"."fact_transaction" "ft" ON (("ft"."account_key" = "wds"."account_key")))
             LEFT JOIN "public"."dim_date" "d" ON (("ft"."date_key" = "d"."date_key")))
             LEFT JOIN "public"."dim_transaction_type" "tt" ON (("ft"."transaction_type_key" = "tt"."transaction_type_key")))
          WHERE (("d"."week_starting_date" <= "wds"."week_start") OR ("ft"."transaction_key" IS NULL))
          GROUP BY "wds"."account_key", "wds"."week_start"
        )
 SELECT "wcf"."account_key",
    "wcf"."week_start",
    "wcf"."cash_flows_to_date" AS "cash_flows",
    COALESCE(( SELECT "sum"("vwp"."position_value") AS "sum"
           FROM "public"."view_weekly_position" "vwp"
          WHERE (("vwp"."account_key" = "wcf"."account_key") AND ("vwp"."week_start" = "wcf"."week_start") AND (("vwp"."security_type")::"text" = 'STOCK'::"text") AND ("vwp"."position_status" = 'OPEN'::"text"))), (0)::numeric) AS "stock_position_value",
    COALESCE(( SELECT "sum"("vwp"."position_value") AS "sum"
           FROM "public"."view_weekly_position" "vwp"
          WHERE (("vwp"."account_key" = "wcf"."account_key") AND ("vwp"."week_start" = "wcf"."week_start") AND (("vwp"."security_type")::"text" = 'OPTION'::"text") AND ("vwp"."position_status" = 'OPEN'::"text"))), (0)::numeric) AS "option_collateral_value",
    "wt"."cumulative_transfers",
    ("wcf"."cash_flows_to_date" + COALESCE(( SELECT "sum"("vwp"."position_value") AS "sum"
           FROM "public"."view_weekly_position" "vwp"
          WHERE (("vwp"."account_key" = "wcf"."account_key") AND ("vwp"."week_start" = "wcf"."week_start") AND (("vwp"."security_type")::"text" = 'STOCK'::"text") AND ("vwp"."position_status" = 'OPEN'::"text"))), (0)::numeric)) AS "total_portfolio_value",
    ("wcf"."cash_flows_to_date" - COALESCE(( SELECT "sum"("vwp"."position_value") AS "sum"
           FROM "public"."view_weekly_position" "vwp"
          WHERE (("vwp"."account_key" = "wcf"."account_key") AND ("vwp"."week_start" = "wcf"."week_start") AND (("vwp"."security_type")::"text" = 'OPTION'::"text") AND ("vwp"."position_status" = 'OPEN'::"text"))), (0)::numeric)) AS "available_cash"
   FROM ("weekly_cash_flows" "wcf"
     JOIN "weekly_transfers" "wt" ON ((("wcf"."account_key" = "wt"."account_key") AND ("wcf"."week_start" = "wt"."week_start"))))
  ORDER BY "wcf"."account_key", "wcf"."week_start";


ALTER VIEW "public"."view_weekly_portfolio_value" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."view_current_portfolio_value" WITH ("security_invoker"='true') AS
 SELECT "wpv"."account_key",
    "wpv"."cash_flows",
    "wpv"."stock_position_value",
    "wpv"."option_collateral_value",
    "wpv"."cumulative_transfers",
    "wpv"."total_portfolio_value",
    "wpv"."available_cash"
   FROM ("public"."view_weekly_portfolio_value" "wpv"
     JOIN ( SELECT "view_weekly_portfolio_value"."account_key",
            "max"("view_weekly_portfolio_value"."week_start") AS "max_week_start"
           FROM "public"."view_weekly_portfolio_value"
          GROUP BY "view_weekly_portfolio_value"."account_key") "latest_weeks" ON ((("wpv"."account_key" = "latest_weeks"."account_key") AND ("wpv"."week_start" = "latest_weeks"."max_week_start"))));


ALTER VIEW "public"."view_current_portfolio_value" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."view_current_position" WITH ("security_invoker"='true') AS
 SELECT "vwp"."account_key",
    "vwp"."symbol",
    "vwp"."security_type",
    "vwp"."underlying_symbol",
    "vwp"."quantity",
    "vwp"."avg_cost_per_unit",
    "vwp"."first_transaction_date",
    "vwp"."last_transaction_date",
    "vwp"."position_value",
    "vwp"."position_status",
    "vwp"."unrealized_pnl",
    "vwp"."option_type",
    "vwp"."expiry_date",
    "vwp"."strike_price"
   FROM ("public"."view_weekly_position" "vwp"
     JOIN ( SELECT "view_weekly_position"."account_key",
            "max"("view_weekly_position"."week_start") AS "max_week_start"
           FROM "public"."view_weekly_position"
          GROUP BY "view_weekly_position"."account_key") "latest_weeks" ON ((("vwp"."account_key" = "latest_weeks"."account_key") AND ("vwp"."week_start" = "latest_weeks"."max_week_start"))));


ALTER VIEW "public"."view_current_position" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."view_daily_activity" WITH ("security_invoker"='true') AS
 WITH "expiry_range" AS (
         SELECT "a"."account_key",
            COALESCE("max"("s"."expiry_date"), CURRENT_DATE) AS "max_expiry_date"
           FROM (("public"."dim_account" "a"
             LEFT JOIN "public"."view_current_position" "vp" ON (("a"."account_key" = "vp"."account_key")))
             LEFT JOIN "public"."dim_security" "s" ON (((("s"."symbol")::"text" = ("vp"."symbol")::"text") AND ("s"."expiry_date" IS NOT NULL) AND ("s"."expiry_date" >= CURRENT_DATE) AND ("abs"("vp"."quantity") > (0)::numeric))))
          WHERE ("a"."is_active" = true)
          GROUP BY "a"."account_key"
        ), "all_weekdays" AS (
         SELECT "d"."full_date",
            "er"."account_key"
           FROM "public"."dim_date" "d",
            "expiry_range" "er"
          WHERE (("d"."full_date" >= (CURRENT_DATE - '6 mons'::interval)) AND ("d"."full_date" <= "er"."max_expiry_date") AND ((EXTRACT(dow FROM "d"."full_date") >= (1)::numeric) AND (EXTRACT(dow FROM "d"."full_date") <= (5)::numeric)))
        ), "daily_data" AS (
         SELECT "d"."full_date",
            "d"."week_starting_date",
            "a"."account_key",
            "sum"(
                CASE
                    WHEN (("tt"."action_category")::"text" = 'TRANSFER'::"text") THEN "ft"."net_amount"
                    ELSE (0)::numeric
                END) AS "daily_transfers",
            ("sum"(
                CASE
                    WHEN ((("tt"."action_category")::"text" <> 'TRANSFER'::"text") AND (("ds"."security_type")::"text" <> 'STOCK'::"text")) THEN "ft"."net_amount"
                    ELSE (0)::numeric
                END) + COALESCE("sum"("vsp"."realized_profit"), (0)::numeric)) AS "daily_gains",
            "count"(
                CASE
                    WHEN (("tt"."action_category")::"text" = 'TRADE'::"text") THEN "ft"."transaction_key"
                    ELSE NULL::integer
                END) AS "trade_count"
           FROM ((((("public"."fact_transaction" "ft"
             JOIN "public"."dim_date" "d" ON (("ft"."date_key" = "d"."date_key")))
             JOIN "public"."dim_account" "a" ON (("ft"."account_key" = "a"."account_key")))
             JOIN "public"."dim_transaction_type" "tt" ON (("ft"."transaction_type_key" = "tt"."transaction_type_key")))
             JOIN "public"."dim_security" "ds" ON (("ft"."security_key" = "ds"."security_key")))
             LEFT JOIN "public"."view_stock_profit" "vsp" ON ((("ft"."account_key" = "vsp"."account_key") AND ("ft"."transaction_key" = "vsp"."transaction_key"))))
          WHERE (("d"."full_date" <= CURRENT_DATE) AND ("d"."full_date" >= (CURRENT_DATE - '6 mons'::interval)) AND ((EXTRACT(dow FROM "d"."full_date") >= (1)::numeric) AND (EXTRACT(dow FROM "d"."full_date") <= (5)::numeric)))
          GROUP BY "a"."account_key", "d"."full_date", "d"."week_starting_date"
        ), "weekly_portfolio_data" AS (
         SELECT "view_weekly_portfolio_value"."account_key",
            "view_weekly_portfolio_value"."week_start",
            "view_weekly_portfolio_value"."total_portfolio_value",
            "view_weekly_portfolio_value"."cumulative_transfers",
            "lag"("view_weekly_portfolio_value"."total_portfolio_value") OVER (PARTITION BY "view_weekly_portfolio_value"."account_key" ORDER BY "view_weekly_portfolio_value"."week_start") AS "previous_week_portfolio_value"
           FROM "public"."view_weekly_portfolio_value"
          WHERE ("view_weekly_portfolio_value"."week_start" >= ((CURRENT_DATE - '6 mons'::interval))::"date")
        ), "daily_returns" AS (
         SELECT "dd"."account_key",
            "dd"."full_date",
            "dd"."trade_count",
            "dd"."daily_gains" AS "daily_premium",
                CASE
                    WHEN (("wpd"."previous_week_portfolio_value" IS NOT NULL) AND ("wpd"."previous_week_portfolio_value" <> (0)::numeric)) THEN "round"((("dd"."daily_gains" / "abs"("wpd"."previous_week_portfolio_value")) * (100)::numeric), 2)
                    WHEN (("wpd"."previous_week_portfolio_value" IS NULL) AND ("wpd"."cumulative_transfers" IS NOT NULL) AND ("wpd"."cumulative_transfers" > (0)::numeric)) THEN "round"((("dd"."daily_gains" / "abs"("wpd"."cumulative_transfers")) * (100)::numeric), 2)
                    ELSE (0)::numeric
                END AS "daily_return_percent"
           FROM ("daily_data" "dd"
             LEFT JOIN "weekly_portfolio_data" "wpd" ON ((("dd"."account_key" = "wpd"."account_key") AND ("dd"."week_starting_date" = "wpd"."week_start"))))
        ), "daily_expiries" AS (
         SELECT "s"."expiry_date" AS "full_date",
            "vp"."account_key",
            "count"(*) AS "expiring_contracts",
            "string_agg"(DISTINCT ("s"."underlying_symbol")::"text", ', '::"text") AS "expiring_symbols"
           FROM ("public"."view_current_position" "vp"
             JOIN "public"."dim_security" "s" ON ((("s"."symbol")::"text" = ("vp"."symbol")::"text")))
          WHERE (("s"."expiry_date" IS NOT NULL) AND ("s"."expiry_date" >= CURRENT_DATE) AND ("abs"("vp"."quantity") > (0)::numeric) AND ((EXTRACT(dow FROM "s"."expiry_date") >= (1)::numeric) AND (EXTRACT(dow FROM "s"."expiry_date") <= (5)::numeric)))
          GROUP BY "s"."expiry_date", "vp"."account_key"
        )
 SELECT "wd"."account_key",
    "wd"."full_date" AS "date",
    COALESCE("dr"."trade_count", (0)::bigint) AS "trade_count",
    COALESCE("dr"."daily_premium", (0)::numeric) AS "daily_premium",
    COALESCE("dr"."daily_return_percent", (0)::numeric) AS "daily_return_percent",
    COALESCE("de"."expiring_contracts", (0)::bigint) AS "expiring_contracts",
    "de"."expiring_symbols",
    ("wd"."full_date" = CURRENT_DATE) AS "is_current_date"
   FROM (("all_weekdays" "wd"
     LEFT JOIN "daily_returns" "dr" ON ((("wd"."full_date" = "dr"."full_date") AND ("wd"."account_key" = "dr"."account_key"))))
     LEFT JOIN "daily_expiries" "de" ON ((("wd"."full_date" = "de"."full_date") AND ("wd"."account_key" = "de"."account_key"))))
  ORDER BY "wd"."account_key", "wd"."full_date" DESC;


ALTER VIEW "public"."view_daily_activity" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."view_portfolio_distribution" WITH ("security_invoker"='true') AS
 SELECT "account_key",
    "underlying_symbol" AS "symbol",
    "sum"("position_value") AS "position_value",
    ("count"(*))::integer AS "instrument_count",
    (("abs"("sum"("position_value")) / "sum"("abs"("sum"("position_value"))) OVER (PARTITION BY "account_key")) * (100)::numeric) AS "portfolio_percentage"
   FROM "public"."view_current_position"
  WHERE ("position_status" = 'OPEN'::"text")
  GROUP BY "account_key", "underlying_symbol"
  ORDER BY ("abs"("sum"("position_value"))) DESC;


ALTER VIEW "public"."view_portfolio_distribution" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."view_portfolio_summary" WITH ("security_invoker"='true') AS
 WITH "realised_monthly_pnl" AS (
         SELECT "a_1"."account_key",
            ("sum"(
                CASE
                    WHEN (("ds"."security_type")::"text" <> 'STOCK'::"text") THEN "ft"."net_amount"
                    ELSE (0)::numeric
                END) + COALESCE("sum"(
                CASE
                    WHEN (("ds"."security_type")::"text" = 'STOCK'::"text") THEN "vsp"."realized_profit"
                    ELSE (0)::numeric
                END), (0)::numeric)) AS "monthly_realised_pnl"
           FROM ((((("public"."fact_transaction" "ft"
             JOIN "public"."dim_date" "d" ON (("ft"."date_key" = "d"."date_key")))
             JOIN "public"."dim_account" "a_1" ON (("ft"."account_key" = "a_1"."account_key")))
             JOIN "public"."dim_security" "ds" ON (("ft"."security_key" = "ds"."security_key")))
             JOIN "public"."dim_transaction_type" "tt_1" ON (("ft"."transaction_type_key" = "tt_1"."transaction_type_key")))
             LEFT JOIN "public"."view_stock_profit" "vsp" ON ((("ft"."account_key" = "vsp"."account_key") AND ("ft"."transaction_key" = "vsp"."transaction_key"))))
          WHERE ((("tt_1"."action_category")::"text" = ANY ((ARRAY['TRADE'::character varying, 'INCOME'::character varying])::"text"[])) AND (("d"."year")::numeric = EXTRACT(year FROM CURRENT_DATE)) AND (("d"."month_number")::numeric = EXTRACT(month FROM CURRENT_DATE)))
          GROUP BY "a_1"."account_key"
        ), "realised_yearly_pnl" AS (
         SELECT "a_1"."account_key",
            ("sum"(
                CASE
                    WHEN (("ds"."security_type")::"text" <> 'STOCK'::"text") THEN "ft"."net_amount"
                    ELSE (0)::numeric
                END) + COALESCE("sum"(
                CASE
                    WHEN (("ds"."security_type")::"text" = 'STOCK'::"text") THEN "vsp"."realized_profit"
                    ELSE (0)::numeric
                END), (0)::numeric)) AS "yearly_realised_pnl"
           FROM ((((("public"."fact_transaction" "ft"
             JOIN "public"."dim_date" "d" ON (("ft"."date_key" = "d"."date_key")))
             JOIN "public"."dim_account" "a_1" ON (("ft"."account_key" = "a_1"."account_key")))
             JOIN "public"."dim_security" "ds" ON (("ft"."security_key" = "ds"."security_key")))
             JOIN "public"."dim_transaction_type" "tt_1" ON (("ft"."transaction_type_key" = "tt_1"."transaction_type_key")))
             LEFT JOIN "public"."view_stock_profit" "vsp" ON ((("ft"."account_key" = "vsp"."account_key") AND ("ft"."transaction_key" = "vsp"."transaction_key"))))
          WHERE ((("tt_1"."action_category")::"text" = ANY ((ARRAY['TRADE'::character varying, 'INCOME'::character varying])::"text"[])) AND (("d"."year")::numeric = EXTRACT(year FROM CURRENT_DATE)))
          GROUP BY "a_1"."account_key"
        ), "total_transfers_calc" AS (
         SELECT "a_1"."account_key",
            "sum"("ft"."net_amount") AS "total_transfers"
           FROM (("public"."fact_transaction" "ft"
             JOIN "public"."dim_account" "a_1" ON (("ft"."account_key" = "a_1"."account_key")))
             JOIN "public"."dim_transaction_type" "tt_1" ON (("ft"."transaction_type_key" = "tt_1"."transaction_type_key")))
          WHERE (("tt_1"."action_category")::"text" = 'TRANSFER'::"text")
          GROUP BY "a_1"."account_key"
        ), "portfolio_value_start_of_month" AS (
         SELECT "wpv"."account_key",
            "wpv"."total_portfolio_value" AS "portfolio_value_start_month"
           FROM "public"."view_weekly_portfolio_value" "wpv"
          WHERE ("wpv"."week_start" = ( SELECT "max"("wpv2"."week_start") AS "max"
                   FROM "public"."view_weekly_portfolio_value" "wpv2"
                  WHERE (("wpv2"."account_key" = "wpv"."account_key") AND ("wpv2"."week_start" < "date_trunc"('month'::"text", (CURRENT_DATE)::timestamp with time zone)))))
        ), "portfolio_value_start_of_year" AS (
         SELECT "wpv"."account_key",
            "wpv"."total_portfolio_value" AS "portfolio_value_start_year"
           FROM "public"."view_weekly_portfolio_value" "wpv"
          WHERE ("wpv"."week_start" = ( SELECT "max"("wpv2"."week_start") AS "max"
                   FROM "public"."view_weekly_portfolio_value" "wpv2"
                  WHERE (("wpv2"."account_key" = "wpv"."account_key") AND ("wpv2"."week_start" < "date_trunc"('year'::"text", (CURRENT_DATE)::timestamp with time zone)))))
        )
 SELECT "a"."account_key",
    COALESCE("pv"."total_portfolio_value", (0)::numeric) AS "portfolio_value",
    COALESCE("pv"."cash_flows", (0)::numeric) AS "cash_balance",
    COALESCE("pv"."available_cash", (0)::numeric) AS "available_cash",
    COALESCE("pv"."stock_position_value", (0)::numeric) AS "stock_position_value",
    COALESCE("pv"."option_collateral_value", (0)::numeric) AS "option_collateral_value",
    COALESCE("mp"."monthly_realised_pnl", (0)::numeric) AS "monthly_pnl",
    COALESCE("yp"."yearly_realised_pnl", (0)::numeric) AS "yearly_pnl",
        CASE
            WHEN (COALESCE("pvsm"."portfolio_value_start_month", (0)::numeric) > (0)::numeric) THEN ((COALESCE("mp"."monthly_realised_pnl", (0)::numeric) / "pvsm"."portfolio_value_start_month") * (100)::numeric)
            WHEN (COALESCE("pv"."cumulative_transfers", (0)::numeric) > (0)::numeric) THEN (((COALESCE("pv"."total_portfolio_value", (0)::numeric) - COALESCE("pv"."cumulative_transfers", (0)::numeric)) / "pv"."cumulative_transfers") * (100)::numeric)
            ELSE (0)::numeric
        END AS "monthly_pnl_percent",
        CASE
            WHEN (COALESCE("pvsy"."portfolio_value_start_year", (0)::numeric) > (0)::numeric) THEN ((COALESCE("yp"."yearly_realised_pnl", (0)::numeric) / "pvsy"."portfolio_value_start_year") * (100)::numeric)
            WHEN (COALESCE("pv"."cumulative_transfers", (0)::numeric) > (0)::numeric) THEN (((COALESCE("pv"."total_portfolio_value", (0)::numeric) - COALESCE("pv"."cumulative_transfers", (0)::numeric)) / "pv"."cumulative_transfers") * (100)::numeric)
            ELSE (0)::numeric
        END AS "yearly_pnl_percent",
        CASE
            WHEN (COALESCE("pv"."cumulative_transfers", (0)::numeric) > (0)::numeric) THEN (((COALESCE("pv"."total_portfolio_value", (0)::numeric) - COALESCE("pv"."cumulative_transfers", (0)::numeric)) / "pv"."cumulative_transfers") * (100)::numeric)
            ELSE (0)::numeric
        END AS "overall_percent_increase"
   FROM (((((("public"."dim_account" "a"
     LEFT JOIN "public"."view_current_portfolio_value" "pv" ON (("a"."account_key" = "pv"."account_key")))
     LEFT JOIN "realised_monthly_pnl" "mp" ON (("a"."account_key" = "mp"."account_key")))
     LEFT JOIN "realised_yearly_pnl" "yp" ON (("a"."account_key" = "yp"."account_key")))
     LEFT JOIN "total_transfers_calc" "tt" ON (("a"."account_key" = "tt"."account_key")))
     LEFT JOIN "portfolio_value_start_of_month" "pvsm" ON (("a"."account_key" = "pvsm"."account_key")))
     LEFT JOIN "portfolio_value_start_of_year" "pvsy" ON (("a"."account_key" = "pvsy"."account_key")))
  WHERE ("a"."is_active" = true);


ALTER VIEW "public"."view_portfolio_summary" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."view_profit_distribution" WITH ("security_invoker"='true') AS
 SELECT "a"."account_key",
    "s"."underlying_symbol",
    "sum"(
        CASE
            WHEN (("s"."security_type")::"text" <> 'STOCK'::"text") THEN "ft"."net_amount"
            WHEN (("s"."security_type")::"text" = 'STOCK'::"text") THEN COALESCE("vsp"."realized_profit", (0)::numeric)
            ELSE (0)::numeric
        END) AS "total_profit",
    ("count"(
        CASE
            WHEN (("s"."security_type")::"text" <> 'STOCK'::"text") THEN 1
            WHEN ((("s"."security_type")::"text" = 'STOCK'::"text") AND ("vsp"."realized_profit" IS NOT NULL) AND ("vsp"."realized_profit" <> (0)::numeric)) THEN 1
            ELSE NULL::integer
        END))::integer AS "trade_count"
   FROM (((("public"."fact_transaction" "ft"
     JOIN "public"."dim_security" "s" ON (("ft"."security_key" = "s"."security_key")))
     JOIN "public"."dim_account" "a" ON (("ft"."account_key" = "a"."account_key")))
     JOIN "public"."dim_transaction_type" "tt" ON (("ft"."transaction_type_key" = "tt"."transaction_type_key")))
     LEFT JOIN "public"."view_stock_profit" "vsp" ON ((("ft"."account_key" = "vsp"."account_key") AND ("ft"."transaction_key" = "vsp"."transaction_key"))))
  WHERE (("tt"."action_category")::"text" = 'TRADE'::"text")
  GROUP BY "a"."account_key", "s"."underlying_symbol"
 HAVING ("sum"(
        CASE
            WHEN (("s"."security_type")::"text" <> 'STOCK'::"text") THEN "ft"."net_amount"
            WHEN (("s"."security_type")::"text" = 'STOCK'::"text") THEN COALESCE("vsp"."realized_profit", (0)::numeric)
            ELSE (0)::numeric
        END) <> (0)::numeric)
  ORDER BY ("sum"(
        CASE
            WHEN (("s"."security_type")::"text" <> 'STOCK'::"text") THEN "ft"."net_amount"
            WHEN (("s"."security_type")::"text" = 'STOCK'::"text") THEN COALESCE("vsp"."realized_profit", (0)::numeric)
            ELSE (0)::numeric
        END)) DESC;


ALTER VIEW "public"."view_profit_distribution" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."view_weekly_return" WITH ("security_invoker"='true') AS
 WITH "weekly_transfers" AS (
         SELECT "a"."account_key",
            "d"."week_starting_date" AS "week_start",
            "sum"(
                CASE
                    WHEN (("tt"."action_category")::"text" = 'TRANSFER'::"text") THEN "ft"."net_amount"
                    ELSE (0)::numeric
                END) AS "weekly_transfers",
            ("sum"(
                CASE
                    WHEN ((("tt"."action_category")::"text" = 'TRADE'::"text") AND (("ds"."security_type")::"text" <> 'STOCK'::"text")) THEN "ft"."net_amount"
                    WHEN (("tt"."action_category")::"text" = 'INCOME'::"text") THEN "ft"."net_amount"
                    ELSE (0)::numeric
                END) + COALESCE("sum"(
                CASE
                    WHEN ((("tt"."action_category")::"text" = 'TRADE'::"text") AND (("ds"."security_type")::"text" = 'STOCK'::"text")) THEN "vsp"."realized_profit"
                    ELSE (0)::numeric
                END), (0)::numeric)) AS "weekly_gains"
           FROM ((((("public"."fact_transaction" "ft"
             JOIN "public"."dim_date" "d" ON (("ft"."date_key" = "d"."date_key")))
             JOIN "public"."dim_account" "a" ON (("ft"."account_key" = "a"."account_key")))
             LEFT JOIN "public"."dim_security" "ds" ON (("ft"."security_key" = "ds"."security_key")))
             JOIN "public"."dim_transaction_type" "tt" ON (("ft"."transaction_type_key" = "tt"."transaction_type_key")))
             LEFT JOIN "public"."view_stock_profit" "vsp" ON ((("ft"."account_key" = "vsp"."account_key") AND ("ft"."transaction_key" = "vsp"."transaction_key"))))
          WHERE ("d"."full_date" <= CURRENT_DATE)
          GROUP BY "a"."account_key", "d"."week_starting_date"
        ), "portfolio_with_transfers" AS (
         SELECT "wpv"."account_key",
            "wpv"."week_start",
            "wpv"."total_portfolio_value" AS "cumulative_portfolio_value",
            "wpv"."cumulative_transfers",
            COALESCE("wt"."weekly_transfers", (0)::numeric) AS "weekly_transfers",
            COALESCE("wt"."weekly_gains", (0)::numeric) AS "weekly_gains"
           FROM ("public"."view_weekly_portfolio_value" "wpv"
             LEFT JOIN "weekly_transfers" "wt" ON ((("wpv"."account_key" = "wt"."account_key") AND ("wpv"."week_start" = "wt"."week_start"))))
        ), "returns_calculation" AS (
         SELECT "portfolio_with_transfers"."account_key",
            "portfolio_with_transfers"."week_start",
            "portfolio_with_transfers"."cumulative_portfolio_value",
            "portfolio_with_transfers"."cumulative_transfers",
            "portfolio_with_transfers"."weekly_transfers",
            "portfolio_with_transfers"."weekly_gains" AS "weekly_return_absolute",
            "lag"("portfolio_with_transfers"."cumulative_portfolio_value", 1) OVER (PARTITION BY "portfolio_with_transfers"."account_key" ORDER BY "portfolio_with_transfers"."week_start") AS "prev_week_portfolio_value"
           FROM "portfolio_with_transfers"
        )
 SELECT "account_key",
    "week_start",
    "cumulative_portfolio_value",
    "cumulative_transfers",
    "weekly_return_absolute",
        CASE
            WHEN ("prev_week_portfolio_value" > (0)::numeric) THEN (((("cumulative_portfolio_value" - "weekly_transfers") - "prev_week_portfolio_value") / ("prev_week_portfolio_value" + ("weekly_transfers" / (2)::numeric))) * (100)::numeric)
            WHEN (("prev_week_portfolio_value" IS NULL) AND ("cumulative_transfers" > (0)::numeric)) THEN (("weekly_return_absolute" / "cumulative_transfers") * (100)::numeric)
            ELSE NULL::numeric
        END AS "weekly_return_percent"
   FROM "returns_calculation"
  WHERE ("week_start" <= CURRENT_DATE)
  ORDER BY "account_key", "week_start";


ALTER VIEW "public"."view_weekly_return" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."active_entitlements" (
    "id" "text" NOT NULL,
    "object" "text",
    "livemode" boolean,
    "feature" "text",
    "customer" "text",
    "lookup_key" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."active_entitlements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."charges" (
    "id" "text" NOT NULL,
    "object" "text",
    "paid" boolean,
    "order" "text",
    "amount" bigint,
    "review" "text",
    "source" "jsonb",
    "status" "text",
    "created" integer,
    "dispute" "text",
    "invoice" "text",
    "outcome" "jsonb",
    "refunds" "jsonb",
    "updated" integer,
    "captured" boolean,
    "currency" "text",
    "customer" "text",
    "livemode" boolean,
    "metadata" "jsonb",
    "refunded" boolean,
    "shipping" "jsonb",
    "application" "text",
    "description" "text",
    "destination" "text",
    "failure_code" "text",
    "on_behalf_of" "text",
    "fraud_details" "jsonb",
    "receipt_email" "text",
    "payment_intent" "text",
    "receipt_number" "text",
    "transfer_group" "text",
    "amount_refunded" bigint,
    "application_fee" "text",
    "failure_message" "text",
    "source_transfer" "text",
    "balance_transaction" "text",
    "statement_descriptor" "text",
    "payment_method_details" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."charges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."checkout_session_line_items" (
    "id" "text" NOT NULL,
    "object" "text",
    "amount_discount" integer,
    "amount_subtotal" integer,
    "amount_tax" integer,
    "amount_total" integer,
    "currency" "text",
    "description" "text",
    "price" "text",
    "quantity" integer,
    "checkout_session" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."checkout_session_line_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."checkout_sessions" (
    "id" "text" NOT NULL,
    "object" "text",
    "adaptive_pricing" "jsonb",
    "after_expiration" "jsonb",
    "allow_promotion_codes" boolean,
    "amount_subtotal" integer,
    "amount_total" integer,
    "automatic_tax" "jsonb",
    "billing_address_collection" "text",
    "cancel_url" "text",
    "client_reference_id" "text",
    "client_secret" "text",
    "collected_information" "jsonb",
    "consent" "jsonb",
    "consent_collection" "jsonb",
    "created" integer,
    "currency" "text",
    "currency_conversion" "jsonb",
    "custom_fields" "jsonb",
    "custom_text" "jsonb",
    "customer" "text",
    "customer_creation" "text",
    "customer_details" "jsonb",
    "customer_email" "text",
    "discounts" "jsonb",
    "expires_at" integer,
    "invoice" "text",
    "invoice_creation" "jsonb",
    "livemode" boolean,
    "locale" "text",
    "metadata" "jsonb",
    "mode" "text",
    "optional_items" "jsonb",
    "payment_intent" "text",
    "payment_link" "text",
    "payment_method_collection" "text",
    "payment_method_configuration_details" "jsonb",
    "payment_method_options" "jsonb",
    "payment_method_types" "jsonb",
    "payment_status" "text",
    "permissions" "jsonb",
    "phone_number_collection" "jsonb",
    "presentment_details" "jsonb",
    "recovered_from" "text",
    "redirect_on_completion" "text",
    "return_url" "text",
    "saved_payment_method_options" "jsonb",
    "setup_intent" "text",
    "shipping_address_collection" "jsonb",
    "shipping_cost" "jsonb",
    "shipping_details" "jsonb",
    "shipping_options" "jsonb",
    "status" "text",
    "submit_type" "text",
    "subscription" "text",
    "success_url" "text",
    "tax_id_collection" "jsonb",
    "total_details" "jsonb",
    "ui_mode" "text",
    "url" "text",
    "wallet_options" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."checkout_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."coupons" (
    "id" "text" NOT NULL,
    "object" "text",
    "name" "text",
    "valid" boolean,
    "created" integer,
    "updated" integer,
    "currency" "text",
    "duration" "text",
    "livemode" boolean,
    "metadata" "jsonb",
    "redeem_by" integer,
    "amount_off" bigint,
    "percent_off" double precision,
    "times_redeemed" bigint,
    "max_redemptions" bigint,
    "duration_in_months" bigint,
    "percent_off_precise" double precision,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."coupons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."credit_notes" (
    "id" "text" NOT NULL,
    "object" "text",
    "amount" integer,
    "amount_shipping" integer,
    "created" integer,
    "currency" "text",
    "customer" "text",
    "customer_balance_transaction" "text",
    "discount_amount" integer,
    "discount_amounts" "jsonb",
    "invoice" "text",
    "lines" "jsonb",
    "livemode" boolean,
    "memo" "text",
    "metadata" "jsonb",
    "number" "text",
    "out_of_band_amount" integer,
    "pdf" "text",
    "reason" "text",
    "refund" "text",
    "shipping_cost" "jsonb",
    "status" "text",
    "subtotal" integer,
    "subtotal_excluding_tax" integer,
    "tax_amounts" "jsonb",
    "total" integer,
    "total_excluding_tax" integer,
    "type" "text",
    "voided_at" "text",
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."credit_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."customers" (
    "id" "text" NOT NULL,
    "object" "text",
    "address" "jsonb",
    "description" "text",
    "email" "text",
    "metadata" "jsonb",
    "name" "text",
    "phone" "text",
    "shipping" "jsonb",
    "balance" integer,
    "created" integer,
    "currency" "text",
    "default_source" "text",
    "delinquent" boolean,
    "discount" "jsonb",
    "invoice_prefix" "text",
    "invoice_settings" "jsonb",
    "livemode" boolean,
    "next_invoice_sequence" integer,
    "preferred_locales" "jsonb",
    "tax_exempt" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."disputes" (
    "id" "text" NOT NULL,
    "object" "text",
    "amount" bigint,
    "charge" "text",
    "reason" "text",
    "status" "text",
    "created" integer,
    "updated" integer,
    "currency" "text",
    "evidence" "jsonb",
    "livemode" boolean,
    "metadata" "jsonb",
    "evidence_details" "jsonb",
    "balance_transactions" "jsonb",
    "is_charge_refundable" boolean,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "payment_intent" "text",
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."disputes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."early_fraud_warnings" (
    "id" "text" NOT NULL,
    "object" "text",
    "actionable" boolean,
    "charge" "text",
    "created" integer,
    "fraud_type" "text",
    "livemode" boolean,
    "payment_intent" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."early_fraud_warnings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."events" (
    "id" "text" NOT NULL,
    "object" "text",
    "data" "jsonb",
    "type" "text",
    "created" integer,
    "request" "text",
    "updated" integer,
    "livemode" boolean,
    "api_version" "text",
    "pending_webhooks" bigint,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."features" (
    "id" "text" NOT NULL,
    "object" "text",
    "livemode" boolean,
    "name" "text",
    "lookup_key" "text",
    "active" boolean,
    "metadata" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."features" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."invoices" (
    "id" "text" NOT NULL,
    "object" "text",
    "auto_advance" boolean,
    "collection_method" "text",
    "currency" "text",
    "description" "text",
    "hosted_invoice_url" "text",
    "lines" "jsonb",
    "metadata" "jsonb",
    "period_end" integer,
    "period_start" integer,
    "status" "stripe"."invoice_status",
    "total" bigint,
    "account_country" "text",
    "account_name" "text",
    "account_tax_ids" "jsonb",
    "amount_due" bigint,
    "amount_paid" bigint,
    "amount_remaining" bigint,
    "application_fee_amount" bigint,
    "attempt_count" integer,
    "attempted" boolean,
    "billing_reason" "text",
    "created" integer,
    "custom_fields" "jsonb",
    "customer_address" "jsonb",
    "customer_email" "text",
    "customer_name" "text",
    "customer_phone" "text",
    "customer_shipping" "jsonb",
    "customer_tax_exempt" "text",
    "customer_tax_ids" "jsonb",
    "default_tax_rates" "jsonb",
    "discount" "jsonb",
    "discounts" "jsonb",
    "due_date" integer,
    "ending_balance" integer,
    "footer" "text",
    "invoice_pdf" "text",
    "last_finalization_error" "jsonb",
    "livemode" boolean,
    "next_payment_attempt" integer,
    "number" "text",
    "paid" boolean,
    "payment_settings" "jsonb",
    "post_payment_credit_notes_amount" integer,
    "pre_payment_credit_notes_amount" integer,
    "receipt_number" "text",
    "starting_balance" integer,
    "statement_descriptor" "text",
    "status_transitions" "jsonb",
    "subtotal" integer,
    "tax" integer,
    "total_discount_amounts" "jsonb",
    "total_tax_amounts" "jsonb",
    "transfer_data" "jsonb",
    "webhooks_delivered_at" integer,
    "customer" "text",
    "subscription" "text",
    "payment_intent" "text",
    "default_payment_method" "text",
    "default_source" "text",
    "on_behalf_of" "text",
    "charge" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."migrations" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "hash" character varying(40) NOT NULL,
    "executed_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "stripe"."migrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."payment_intents" (
    "id" "text" NOT NULL,
    "object" "text",
    "amount" integer,
    "amount_capturable" integer,
    "amount_details" "jsonb",
    "amount_received" integer,
    "application" "text",
    "application_fee_amount" integer,
    "automatic_payment_methods" "text",
    "canceled_at" integer,
    "cancellation_reason" "text",
    "capture_method" "text",
    "client_secret" "text",
    "confirmation_method" "text",
    "created" integer,
    "currency" "text",
    "customer" "text",
    "description" "text",
    "invoice" "text",
    "last_payment_error" "text",
    "livemode" boolean,
    "metadata" "jsonb",
    "next_action" "text",
    "on_behalf_of" "text",
    "payment_method" "text",
    "payment_method_options" "jsonb",
    "payment_method_types" "jsonb",
    "processing" "text",
    "receipt_email" "text",
    "review" "text",
    "setup_future_usage" "text",
    "shipping" "jsonb",
    "statement_descriptor" "text",
    "statement_descriptor_suffix" "text",
    "status" "text",
    "transfer_data" "jsonb",
    "transfer_group" "text",
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."payment_intents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."payment_methods" (
    "id" "text" NOT NULL,
    "object" "text",
    "created" integer,
    "customer" "text",
    "type" "text",
    "billing_details" "jsonb",
    "metadata" "jsonb",
    "card" "jsonb",
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."payment_methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."payouts" (
    "id" "text" NOT NULL,
    "object" "text",
    "date" "text",
    "type" "text",
    "amount" bigint,
    "method" "text",
    "status" "text",
    "created" integer,
    "updated" integer,
    "currency" "text",
    "livemode" boolean,
    "metadata" "jsonb",
    "automatic" boolean,
    "recipient" "text",
    "description" "text",
    "destination" "text",
    "source_type" "text",
    "arrival_date" "text",
    "bank_account" "jsonb",
    "failure_code" "text",
    "transfer_group" "text",
    "amount_reversed" bigint,
    "failure_message" "text",
    "source_transaction" "text",
    "balance_transaction" "text",
    "statement_descriptor" "text",
    "statement_description" "text",
    "failure_balance_transaction" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."payouts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."plans" (
    "id" "text" NOT NULL,
    "object" "text",
    "active" boolean,
    "amount" bigint,
    "created" integer,
    "product" "text",
    "currency" "text",
    "interval" "text",
    "livemode" boolean,
    "metadata" "jsonb",
    "nickname" "text",
    "tiers_mode" "text",
    "usage_type" "text",
    "billing_scheme" "text",
    "interval_count" bigint,
    "aggregate_usage" "text",
    "transform_usage" "text",
    "trial_period_days" bigint,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."prices" (
    "id" "text" NOT NULL,
    "object" "text",
    "active" boolean,
    "currency" "text",
    "metadata" "jsonb",
    "nickname" "text",
    "recurring" "jsonb",
    "type" "stripe"."pricing_type",
    "unit_amount" integer,
    "billing_scheme" "text",
    "created" integer,
    "livemode" boolean,
    "lookup_key" "text",
    "tiers_mode" "stripe"."pricing_tiers",
    "transform_quantity" "jsonb",
    "unit_amount_decimal" "text",
    "product" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."prices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."products" (
    "id" "text" NOT NULL,
    "object" "text",
    "active" boolean,
    "description" "text",
    "metadata" "jsonb",
    "name" "text",
    "created" integer,
    "images" "jsonb",
    "livemode" boolean,
    "package_dimensions" "jsonb",
    "shippable" boolean,
    "statement_descriptor" "text",
    "unit_label" "text",
    "updated" integer,
    "url" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "marketing_features" "jsonb",
    "default_price" "text",
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."refunds" (
    "id" "text" NOT NULL,
    "object" "text",
    "amount" integer,
    "balance_transaction" "text",
    "charge" "text",
    "created" integer,
    "currency" "text",
    "destination_details" "jsonb",
    "metadata" "jsonb",
    "payment_intent" "text",
    "reason" "text",
    "receipt_number" "text",
    "source_transfer_reversal" "text",
    "status" "text",
    "transfer_reversal" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."refunds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."reviews" (
    "id" "text" NOT NULL,
    "object" "text",
    "billing_zip" "text",
    "charge" "text",
    "created" integer,
    "closed_reason" "text",
    "livemode" boolean,
    "ip_address" "text",
    "ip_address_location" "jsonb",
    "open" boolean,
    "opened_reason" "text",
    "payment_intent" "text",
    "reason" "text",
    "session" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."setup_intents" (
    "id" "text" NOT NULL,
    "object" "text",
    "created" integer,
    "customer" "text",
    "description" "text",
    "payment_method" "text",
    "status" "text",
    "usage" "text",
    "cancellation_reason" "text",
    "latest_attempt" "text",
    "mandate" "text",
    "single_use_mandate" "text",
    "on_behalf_of" "text",
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."setup_intents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."subscription_items" (
    "id" "text" NOT NULL,
    "object" "text",
    "billing_thresholds" "jsonb",
    "created" integer,
    "deleted" boolean,
    "metadata" "jsonb",
    "quantity" integer,
    "price" "text",
    "subscription" "text",
    "tax_rates" "jsonb",
    "current_period_end" integer,
    "current_period_start" integer,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."subscription_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."subscription_schedules" (
    "id" "text" NOT NULL,
    "object" "text",
    "application" "text",
    "canceled_at" integer,
    "completed_at" integer,
    "created" integer NOT NULL,
    "current_phase" "jsonb",
    "customer" "text" NOT NULL,
    "default_settings" "jsonb",
    "end_behavior" "text",
    "livemode" boolean NOT NULL,
    "metadata" "jsonb" NOT NULL,
    "phases" "jsonb" NOT NULL,
    "released_at" integer,
    "released_subscription" "text",
    "status" "stripe"."subscription_schedule_status" NOT NULL,
    "subscription" "text",
    "test_clock" "text",
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."subscription_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."subscriptions" (
    "id" "text" NOT NULL,
    "object" "text",
    "cancel_at_period_end" boolean,
    "current_period_end" integer,
    "current_period_start" integer,
    "default_payment_method" "text",
    "items" "jsonb",
    "metadata" "jsonb",
    "pending_setup_intent" "text",
    "pending_update" "jsonb",
    "status" "stripe"."subscription_status",
    "application_fee_percent" double precision,
    "billing_cycle_anchor" integer,
    "billing_thresholds" "jsonb",
    "cancel_at" integer,
    "canceled_at" integer,
    "collection_method" "text",
    "created" integer,
    "days_until_due" integer,
    "default_source" "text",
    "default_tax_rates" "jsonb",
    "discount" "jsonb",
    "ended_at" integer,
    "livemode" boolean,
    "next_pending_invoice_item_invoice" integer,
    "pause_collection" "jsonb",
    "pending_invoice_item_interval" "jsonb",
    "start_date" integer,
    "transfer_data" "jsonb",
    "trial_end" "jsonb",
    "trial_start" "jsonb",
    "schedule" "text",
    "customer" "text",
    "latest_invoice" "text",
    "plan" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."tax_ids" (
    "id" "text" NOT NULL,
    "object" "text",
    "country" "text",
    "customer" "text",
    "type" "text",
    "value" "text",
    "created" integer NOT NULL,
    "livemode" boolean,
    "owner" "jsonb",
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "stripe"."tax_ids" OWNER TO "postgres";


ALTER TABLE ONLY "drizzle"."__drizzle_migrations" ALTER COLUMN "id" SET DEFAULT "nextval"('"drizzle"."__drizzle_migrations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."dim_account" ALTER COLUMN "account_key" SET DEFAULT "nextval"('"public"."dim_account_account_key_seq"'::"regclass");



ALTER TABLE ONLY "public"."dim_account_access_token" ALTER COLUMN "access_token_key" SET DEFAULT "nextval"('"public"."dim_account_access_tokens_access_token_key_seq"'::"regclass");



ALTER TABLE ONLY "public"."dim_broker" ALTER COLUMN "broker_key" SET DEFAULT "nextval"('"public"."dim_broker_broker_key_seq"'::"regclass");



ALTER TABLE ONLY "public"."dim_broker_account" ALTER COLUMN "broker_account_key" SET DEFAULT "nextval"('"public"."dim_broker_accounts_broker_account_key_seq"'::"regclass");



ALTER TABLE ONLY "public"."dim_security" ALTER COLUMN "security_key" SET DEFAULT "nextval"('"public"."dim_security_security_key_seq"'::"regclass");



ALTER TABLE ONLY "public"."dim_time" ALTER COLUMN "time_key" SET DEFAULT "nextval"('"public"."dim_time_time_key_seq"'::"regclass");



ALTER TABLE ONLY "public"."dim_transaction_type" ALTER COLUMN "transaction_type_key" SET DEFAULT "nextval"('"public"."dim_transaction_type_transaction_type_key_seq"'::"regclass");



ALTER TABLE ONLY "public"."dim_user" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."users_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."fact_stock_prices" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."fact_stock_prices_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."fact_transaction" ALTER COLUMN "transaction_key" SET DEFAULT "nextval"('"public"."fact_transactions_transaction_key_seq"'::"regclass");



ALTER TABLE ONLY "public"."rtm_sync_progress" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."rtm_sync_progress_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."stg_transaction" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."raw_transactions_id_seq"'::"regclass");



ALTER TABLE ONLY "drizzle"."__drizzle_migrations"
    ADD CONSTRAINT "__drizzle_migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dim_account_access_token"
    ADD CONSTRAINT "dim_account_access_tokens_pkey" PRIMARY KEY ("access_token_key");



ALTER TABLE ONLY "public"."dim_account"
    ADD CONSTRAINT "dim_account_pkey" PRIMARY KEY ("account_key");



ALTER TABLE ONLY "public"."dim_broker_account"
    ADD CONSTRAINT "dim_broker_accounts_pkey" PRIMARY KEY ("broker_account_key");



ALTER TABLE ONLY "public"."dim_broker"
    ADD CONSTRAINT "dim_broker_broker_code_unique" UNIQUE ("broker_code");



ALTER TABLE ONLY "public"."dim_broker"
    ADD CONSTRAINT "dim_broker_pkey" PRIMARY KEY ("broker_key");



ALTER TABLE ONLY "public"."dim_date"
    ADD CONSTRAINT "dim_date_full_date_unique" UNIQUE ("full_date");



ALTER TABLE ONLY "public"."dim_date"
    ADD CONSTRAINT "dim_date_pkey" PRIMARY KEY ("date_key");



ALTER TABLE ONLY "public"."dim_security"
    ADD CONSTRAINT "dim_security_pkey" PRIMARY KEY ("security_key");



ALTER TABLE ONLY "public"."dim_time"
    ADD CONSTRAINT "dim_time_pkey" PRIMARY KEY ("time_key");



ALTER TABLE ONLY "public"."dim_time"
    ADD CONSTRAINT "dim_time_time_value_unique" UNIQUE ("time_value");



ALTER TABLE ONLY "public"."dim_transaction_type"
    ADD CONSTRAINT "dim_transaction_type_action_code_unique" UNIQUE ("action_code");



ALTER TABLE ONLY "public"."dim_transaction_type"
    ADD CONSTRAINT "dim_transaction_type_pkey" PRIMARY KEY ("transaction_type_key");



ALTER TABLE ONLY "public"."dim_user"
    ADD CONSTRAINT "dim_user_auth_user_id_unique" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."dim_user"
    ADD CONSTRAINT "dim_user_email_unique" UNIQUE ("email");



ALTER TABLE ONLY "public"."fact_stock_prices"
    ADD CONSTRAINT "fact_stock_prices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fact_transaction"
    ADD CONSTRAINT "fact_transactions_pkey" PRIMARY KEY ("transaction_key");



ALTER TABLE ONLY "public"."stg_transaction"
    ADD CONSTRAINT "raw_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rtm_sync_progress"
    ADD CONSTRAINT "rtm_sync_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dim_account_access_token"
    ADD CONSTRAINT "unique_account_broker_token" UNIQUE ("account_key", "broker_code");



ALTER TABLE ONLY "public"."stg_transaction"
    ADD CONSTRAINT "unique_account_broker_transaction" UNIQUE ("account_key", "broker_transaction_id", "broker_code");



ALTER TABLE ONLY "public"."fact_transaction"
    ADD CONSTRAINT "unique_account_transaction" UNIQUE ("account_key", "broker_transaction_id", "original_transaction_id");



ALTER TABLE ONLY "public"."dim_broker_account"
    ADD CONSTRAINT "unique_broker_account" UNIQUE ("account_key", "broker_key", "broker_account_number");



ALTER TABLE ONLY "public"."fact_stock_prices"
    ADD CONSTRAINT "unique_symbol_time_cache" UNIQUE ("symbol", "date_key", "quarter_hour");



ALTER TABLE ONLY "public"."dim_user"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."active_entitlements"
    ADD CONSTRAINT "active_entitlements_lookup_key_key" UNIQUE ("lookup_key");



ALTER TABLE ONLY "stripe"."active_entitlements"
    ADD CONSTRAINT "active_entitlements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."charges"
    ADD CONSTRAINT "charges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."checkout_session_line_items"
    ADD CONSTRAINT "checkout_session_line_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."checkout_sessions"
    ADD CONSTRAINT "checkout_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."coupons"
    ADD CONSTRAINT "coupons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."credit_notes"
    ADD CONSTRAINT "credit_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."disputes"
    ADD CONSTRAINT "disputes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."early_fraud_warnings"
    ADD CONSTRAINT "early_fraud_warnings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."features"
    ADD CONSTRAINT "features_lookup_key_key" UNIQUE ("lookup_key");



ALTER TABLE ONLY "stripe"."features"
    ADD CONSTRAINT "features_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."migrations"
    ADD CONSTRAINT "migrations_name_key" UNIQUE ("name");



ALTER TABLE ONLY "stripe"."migrations"
    ADD CONSTRAINT "migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."payment_intents"
    ADD CONSTRAINT "payment_intents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."payment_methods"
    ADD CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."payouts"
    ADD CONSTRAINT "payouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."prices"
    ADD CONSTRAINT "prices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."refunds"
    ADD CONSTRAINT "refunds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."setup_intents"
    ADD CONSTRAINT "setup_intents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."subscription_items"
    ADD CONSTRAINT "subscription_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."subscription_schedules"
    ADD CONSTRAINT "subscription_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."tax_ids"
    ADD CONSTRAINT "tax_ids_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_broker_account_account_broker" ON "public"."dim_broker_account" USING "btree" ("account_key", "broker_key");



CREATE INDEX "idx_broker_account_hash" ON "public"."dim_broker_account" USING "btree" ("broker_account_hash");



CREATE INDEX "idx_dim_date_full_date" ON "public"."dim_date" USING "btree" ("full_date");



CREATE INDEX "idx_dim_date_year_month" ON "public"."dim_date" USING "btree" ("year", "month_number");



CREATE INDEX "idx_dim_security_symbol" ON "public"."dim_security" USING "btree" ("symbol");



CREATE INDEX "idx_dim_security_type" ON "public"."dim_security" USING "btree" ("security_type");



CREATE INDEX "idx_dim_security_underlying" ON "public"."dim_security" USING "btree" ("underlying_symbol");



CREATE INDEX "idx_dim_time_hour" ON "public"."dim_time" USING "btree" ("hour");



CREATE INDEX "idx_dim_time_hour_minute" ON "public"."dim_time" USING "btree" ("hour", "minute");



CREATE INDEX "idx_dim_time_time_value" ON "public"."dim_time" USING "btree" ("time_value");



CREATE INDEX "idx_dim_user_auth_user_id" ON "public"."dim_user" USING "btree" ("auth_user_id");



CREATE INDEX "idx_fact_stock_prices_created_at" ON "public"."fact_stock_prices" USING "btree" ("created_at");



CREATE INDEX "idx_fact_stock_prices_date_time" ON "public"."fact_stock_prices" USING "btree" ("date_key", "quarter_hour");



CREATE INDEX "idx_fact_stock_prices_symbol" ON "public"."fact_stock_prices" USING "btree" ("symbol");



CREATE INDEX "idx_fact_transaction_account" ON "public"."fact_transaction" USING "btree" ("account_key");



CREATE INDEX "idx_fact_transaction_date" ON "public"."fact_transaction" USING "btree" ("date_key");



CREATE INDEX "idx_fact_transaction_date_time" ON "public"."fact_transaction" USING "btree" ("date_key", "time_key");



CREATE INDEX "idx_fact_transaction_security" ON "public"."fact_transaction" USING "btree" ("security_key");



CREATE INDEX "idx_fact_transaction_time" ON "public"."fact_transaction" USING "btree" ("time_key");



CREATE INDEX "idx_stg_transaction_account_status" ON "public"."stg_transaction" USING "btree" ("account_key", "status");



CREATE INDEX "idx_stg_transaction_broker_id" ON "public"."stg_transaction" USING "btree" ("broker_transaction_id");



CREATE UNIQUE INDEX "rtm_sync_progress_account_key_unique" ON "public"."rtm_sync_progress" USING "btree" ("account_key");



CREATE INDEX "stripe_active_entitlements_customer_idx" ON "stripe"."active_entitlements" USING "btree" ("customer");



CREATE INDEX "stripe_active_entitlements_feature_idx" ON "stripe"."active_entitlements" USING "btree" ("feature");



CREATE INDEX "stripe_checkout_session_line_items_price_idx" ON "stripe"."checkout_session_line_items" USING "btree" ("price");



CREATE INDEX "stripe_checkout_session_line_items_session_idx" ON "stripe"."checkout_session_line_items" USING "btree" ("checkout_session");



CREATE INDEX "stripe_checkout_sessions_customer_idx" ON "stripe"."checkout_sessions" USING "btree" ("customer");



CREATE INDEX "stripe_checkout_sessions_invoice_idx" ON "stripe"."checkout_sessions" USING "btree" ("invoice");



CREATE INDEX "stripe_checkout_sessions_payment_intent_idx" ON "stripe"."checkout_sessions" USING "btree" ("payment_intent");



CREATE INDEX "stripe_checkout_sessions_subscription_idx" ON "stripe"."checkout_sessions" USING "btree" ("subscription");



CREATE INDEX "stripe_credit_notes_customer_idx" ON "stripe"."credit_notes" USING "btree" ("customer");



CREATE INDEX "stripe_credit_notes_invoice_idx" ON "stripe"."credit_notes" USING "btree" ("invoice");



CREATE INDEX "stripe_dispute_created_idx" ON "stripe"."disputes" USING "btree" ("created");



CREATE INDEX "stripe_early_fraud_warnings_charge_idx" ON "stripe"."early_fraud_warnings" USING "btree" ("charge");



CREATE INDEX "stripe_early_fraud_warnings_payment_intent_idx" ON "stripe"."early_fraud_warnings" USING "btree" ("payment_intent");



CREATE INDEX "stripe_invoices_customer_idx" ON "stripe"."invoices" USING "btree" ("customer");



CREATE INDEX "stripe_invoices_subscription_idx" ON "stripe"."invoices" USING "btree" ("subscription");



CREATE INDEX "stripe_payment_intents_customer_idx" ON "stripe"."payment_intents" USING "btree" ("customer");



CREATE INDEX "stripe_payment_intents_invoice_idx" ON "stripe"."payment_intents" USING "btree" ("invoice");



CREATE INDEX "stripe_payment_methods_customer_idx" ON "stripe"."payment_methods" USING "btree" ("customer");



CREATE INDEX "stripe_refunds_charge_idx" ON "stripe"."refunds" USING "btree" ("charge");



CREATE INDEX "stripe_refunds_payment_intent_idx" ON "stripe"."refunds" USING "btree" ("payment_intent");



CREATE INDEX "stripe_reviews_charge_idx" ON "stripe"."reviews" USING "btree" ("charge");



CREATE INDEX "stripe_reviews_payment_intent_idx" ON "stripe"."reviews" USING "btree" ("payment_intent");



CREATE INDEX "stripe_setup_intents_customer_idx" ON "stripe"."setup_intents" USING "btree" ("customer");



CREATE INDEX "stripe_tax_ids_customer_idx" ON "stripe"."tax_ids" USING "btree" ("customer");



CREATE OR REPLACE TRIGGER "trigger_handle_user_deletion" AFTER UPDATE ON "public"."dim_user" FOR EACH ROW EXECUTE FUNCTION "public"."handle_user_deletion"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."active_entitlements" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."charges" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."checkout_session_line_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."checkout_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."coupons" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."disputes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."early_fraud_warnings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."events" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."features" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."payouts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."plans" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."prices" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."products" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."refunds" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."dim_account_access_token"
    ADD CONSTRAINT "dim_account_access_token_account_key_dim_account_account_key_fk" FOREIGN KEY ("account_key") REFERENCES "public"."dim_account"("account_key") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dim_account_access_token"
    ADD CONSTRAINT "dim_account_access_token_broker_code_dim_broker_broker_code_fk" FOREIGN KEY ("broker_code") REFERENCES "public"."dim_broker"("broker_code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dim_account"
    ADD CONSTRAINT "dim_account_user_id_dim_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."dim_user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dim_broker_account"
    ADD CONSTRAINT "dim_broker_account_account_key_dim_account_account_key_fk" FOREIGN KEY ("account_key") REFERENCES "public"."dim_account"("account_key") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dim_broker_account"
    ADD CONSTRAINT "dim_broker_account_broker_key_dim_broker_broker_key_fk" FOREIGN KEY ("broker_key") REFERENCES "public"."dim_broker"("broker_key") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dim_user"
    ADD CONSTRAINT "dim_user_auth_user_id_users_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fact_stock_prices"
    ADD CONSTRAINT "fact_stock_prices_date_key_dim_date_date_key_fk" FOREIGN KEY ("date_key") REFERENCES "public"."dim_date"("date_key");



ALTER TABLE ONLY "public"."fact_transaction"
    ADD CONSTRAINT "fact_transaction_account_key_dim_account_account_key_fk" FOREIGN KEY ("account_key") REFERENCES "public"."dim_account"("account_key") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fact_transaction"
    ADD CONSTRAINT "fact_transaction_broker_key_dim_broker_broker_key_fk" FOREIGN KEY ("broker_key") REFERENCES "public"."dim_broker"("broker_key");



ALTER TABLE ONLY "public"."fact_transaction"
    ADD CONSTRAINT "fact_transaction_date_key_dim_date_date_key_fk" FOREIGN KEY ("date_key") REFERENCES "public"."dim_date"("date_key");



ALTER TABLE ONLY "public"."fact_transaction"
    ADD CONSTRAINT "fact_transaction_security_key_dim_security_security_key_fk" FOREIGN KEY ("security_key") REFERENCES "public"."dim_security"("security_key");



ALTER TABLE ONLY "public"."fact_transaction"
    ADD CONSTRAINT "fact_transaction_time_key_dim_time_time_key_fk" FOREIGN KEY ("time_key") REFERENCES "public"."dim_time"("time_key");



ALTER TABLE ONLY "public"."fact_transaction"
    ADD CONSTRAINT "fact_transaction_transaction_type_key_dim_transaction_type_tran" FOREIGN KEY ("transaction_type_key") REFERENCES "public"."dim_transaction_type"("transaction_type_key");



ALTER TABLE ONLY "public"."fact_transaction"
    ADD CONSTRAINT "fact_transactions_account_key_dim_account_account_key_fk" FOREIGN KEY ("account_key") REFERENCES "public"."dim_account"("account_key");



ALTER TABLE ONLY "public"."fact_transaction"
    ADD CONSTRAINT "fk_fact_transaction_security" FOREIGN KEY ("security_key") REFERENCES "public"."dim_security"("security_key");



ALTER TABLE ONLY "public"."rtm_sync_progress"
    ADD CONSTRAINT "rtm_sync_progress_account_key_dim_account_account_key_fk" FOREIGN KEY ("account_key") REFERENCES "public"."dim_account"("account_key") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stg_transaction"
    ADD CONSTRAINT "stg_transaction_account_key_dim_account_account_key_fk" FOREIGN KEY ("account_key") REFERENCES "public"."dim_account"("account_key") ON DELETE CASCADE;



ALTER TABLE ONLY "stripe"."checkout_session_line_items"
    ADD CONSTRAINT "checkout_session_line_items_checkout_session_fkey" FOREIGN KEY ("checkout_session") REFERENCES "stripe"."checkout_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "stripe"."checkout_session_line_items"
    ADD CONSTRAINT "checkout_session_line_items_price_fkey" FOREIGN KEY ("price") REFERENCES "stripe"."prices"("id") ON DELETE CASCADE;



CREATE POLICY "authenticated_can_read_brokers" ON "public"."dim_broker" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_can_read_dates" ON "public"."dim_date" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_can_read_securities" ON "public"."dim_security" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_can_read_stock_prices" ON "public"."fact_stock_prices" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_can_read_times" ON "public"."dim_time" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_can_read_transaction_types" ON "public"."dim_transaction_type" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."dim_account" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dim_account_access_token" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dim_broker" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dim_broker_account" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dim_date" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dim_security" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dim_time" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dim_transaction_type" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dim_user" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fact_stock_prices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fact_transaction" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rtm_sync_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stg_transaction" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_own_account_tokens" ON "public"."dim_account_access_token" TO "authenticated" USING (("account_key" IN ( SELECT "da"."account_key"
   FROM ("public"."dim_account" "da"
     JOIN "public"."dim_user" "du" ON (("da"."user_id" = "du"."id")))
  WHERE ("du"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "users_own_accounts" ON "public"."dim_account" TO "authenticated" USING (("user_id" IN ( SELECT "dim_user"."id"
   FROM "public"."dim_user"
  WHERE ("dim_user"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "users_own_broker_accounts" ON "public"."dim_broker_account" TO "authenticated" USING (("account_key" IN ( SELECT "da"."account_key"
   FROM ("public"."dim_account" "da"
     JOIN "public"."dim_user" "du" ON (("da"."user_id" = "du"."id")))
  WHERE ("du"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "users_own_data" ON "public"."dim_user" TO "authenticated" USING (("auth_user_id" = "auth"."uid"()));



CREATE POLICY "users_own_staging_transactions" ON "public"."stg_transaction" TO "authenticated" USING (("account_key" IN ( SELECT "da"."account_key"
   FROM ("public"."dim_account" "da"
     JOIN "public"."dim_user" "du" ON (("da"."user_id" = "du"."id")))
  WHERE ("du"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "users_own_sync_progress" ON "public"."rtm_sync_progress" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK (("account_key" IN ( SELECT "da"."account_key"
   FROM ("public"."dim_account" "da"
     JOIN "public"."dim_user" "du" ON (("da"."user_id" = "du"."id")))
  WHERE ("du"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "users_own_transactions" ON "public"."fact_transaction" TO "authenticated" USING (("account_key" IN ( SELECT "da"."account_key"
   FROM ("public"."dim_account" "da"
     JOIN "public"."dim_user" "du" ON (("da"."user_id" = "du"."id")))
  WHERE ("du"."auth_user_id" = "auth"."uid"()))));



ALTER TABLE "stripe"."active_entitlements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_full_access_active_entitlements" ON "stripe"."active_entitlements" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_charges" ON "stripe"."charges" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_checkout_session_line_items" ON "stripe"."checkout_session_line_items" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_checkout_sessions" ON "stripe"."checkout_sessions" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_coupons" ON "stripe"."coupons" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_credit_notes" ON "stripe"."credit_notes" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_customers" ON "stripe"."customers" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_disputes" ON "stripe"."disputes" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_early_fraud_warnings" ON "stripe"."early_fraud_warnings" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_events" ON "stripe"."events" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_features" ON "stripe"."features" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_invoices" ON "stripe"."invoices" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_migrations" ON "stripe"."migrations" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_payment_intents" ON "stripe"."payment_intents" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_payment_methods" ON "stripe"."payment_methods" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_payouts" ON "stripe"."payouts" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_plans" ON "stripe"."plans" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_prices" ON "stripe"."prices" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_products" ON "stripe"."products" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_refunds" ON "stripe"."refunds" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_reviews" ON "stripe"."reviews" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_setup_intents" ON "stripe"."setup_intents" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_subscription_items" ON "stripe"."subscription_items" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_subscription_schedules" ON "stripe"."subscription_schedules" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_subscriptions" ON "stripe"."subscriptions" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_full_access_tax_ids" ON "stripe"."tax_ids" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "stripe"."charges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "stripe"."checkout_session_line_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "stripe"."checkout_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "stripe"."coupons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "stripe"."credit_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "stripe"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "stripe"."disputes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "stripe"."early_fraud_warnings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "stripe"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "stripe"."features" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "stripe"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "stripe"."migrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "stripe"."payment_intents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "stripe"."payment_methods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "stripe"."payouts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "stripe"."plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "stripe"."prices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "stripe"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "stripe"."refunds" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "stripe"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "stripe"."setup_intents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "stripe"."subscription_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "stripe"."subscription_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "stripe"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "stripe"."tax_ids" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."rtm_sync_progress";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT USAGE ON SCHEMA "stripe" TO "anon";
GRANT USAGE ON SCHEMA "stripe" TO "authenticated";
GRANT USAGE ON SCHEMA "stripe" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."handle_user_deletion"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_deletion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_deletion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."dim_account" TO "anon";
GRANT ALL ON TABLE "public"."dim_account" TO "authenticated";
GRANT ALL ON TABLE "public"."dim_account" TO "service_role";



GRANT ALL ON TABLE "public"."dim_account_access_token" TO "anon";
GRANT ALL ON TABLE "public"."dim_account_access_token" TO "authenticated";
GRANT ALL ON TABLE "public"."dim_account_access_token" TO "service_role";



GRANT ALL ON SEQUENCE "public"."dim_account_access_tokens_access_token_key_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."dim_account_access_tokens_access_token_key_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."dim_account_access_tokens_access_token_key_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."dim_account_account_key_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."dim_account_account_key_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."dim_account_account_key_seq" TO "service_role";



GRANT ALL ON TABLE "public"."dim_broker" TO "anon";
GRANT ALL ON TABLE "public"."dim_broker" TO "authenticated";
GRANT ALL ON TABLE "public"."dim_broker" TO "service_role";



GRANT ALL ON TABLE "public"."dim_broker_account" TO "anon";
GRANT ALL ON TABLE "public"."dim_broker_account" TO "authenticated";
GRANT ALL ON TABLE "public"."dim_broker_account" TO "service_role";



GRANT ALL ON SEQUENCE "public"."dim_broker_accounts_broker_account_key_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."dim_broker_accounts_broker_account_key_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."dim_broker_accounts_broker_account_key_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."dim_broker_broker_key_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."dim_broker_broker_key_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."dim_broker_broker_key_seq" TO "service_role";



GRANT ALL ON TABLE "public"."dim_date" TO "anon";
GRANT ALL ON TABLE "public"."dim_date" TO "authenticated";
GRANT ALL ON TABLE "public"."dim_date" TO "service_role";



GRANT ALL ON TABLE "public"."dim_security" TO "anon";
GRANT ALL ON TABLE "public"."dim_security" TO "authenticated";
GRANT ALL ON TABLE "public"."dim_security" TO "service_role";



GRANT ALL ON SEQUENCE "public"."dim_security_security_key_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."dim_security_security_key_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."dim_security_security_key_seq" TO "service_role";



GRANT ALL ON TABLE "public"."dim_time" TO "anon";
GRANT ALL ON TABLE "public"."dim_time" TO "authenticated";
GRANT ALL ON TABLE "public"."dim_time" TO "service_role";



GRANT ALL ON SEQUENCE "public"."dim_time_time_key_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."dim_time_time_key_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."dim_time_time_key_seq" TO "service_role";



GRANT ALL ON TABLE "public"."dim_transaction_type" TO "anon";
GRANT ALL ON TABLE "public"."dim_transaction_type" TO "authenticated";
GRANT ALL ON TABLE "public"."dim_transaction_type" TO "service_role";



GRANT ALL ON SEQUENCE "public"."dim_transaction_type_transaction_type_key_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."dim_transaction_type_transaction_type_key_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."dim_transaction_type_transaction_type_key_seq" TO "service_role";



GRANT ALL ON TABLE "public"."dim_user" TO "anon";
GRANT ALL ON TABLE "public"."dim_user" TO "authenticated";
GRANT ALL ON TABLE "public"."dim_user" TO "service_role";



GRANT ALL ON TABLE "public"."fact_stock_prices" TO "anon";
GRANT ALL ON TABLE "public"."fact_stock_prices" TO "authenticated";
GRANT ALL ON TABLE "public"."fact_stock_prices" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fact_stock_prices_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fact_stock_prices_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fact_stock_prices_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."fact_transaction" TO "anon";
GRANT ALL ON TABLE "public"."fact_transaction" TO "authenticated";
GRANT ALL ON TABLE "public"."fact_transaction" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fact_transactions_transaction_key_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fact_transactions_transaction_key_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fact_transactions_transaction_key_seq" TO "service_role";



GRANT ALL ON TABLE "public"."stg_transaction" TO "anon";
GRANT ALL ON TABLE "public"."stg_transaction" TO "authenticated";
GRANT ALL ON TABLE "public"."stg_transaction" TO "service_role";



GRANT ALL ON SEQUENCE "public"."raw_transactions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."raw_transactions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."raw_transactions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."rtm_sync_progress" TO "anon";
GRANT ALL ON TABLE "public"."rtm_sync_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."rtm_sync_progress" TO "service_role";



GRANT ALL ON SEQUENCE "public"."rtm_sync_progress_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."rtm_sync_progress_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."rtm_sync_progress_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."view_stock_profit" TO "anon";
GRANT ALL ON TABLE "public"."view_stock_profit" TO "authenticated";
GRANT ALL ON TABLE "public"."view_stock_profit" TO "service_role";



GRANT ALL ON TABLE "public"."view_weekly_position" TO "anon";
GRANT ALL ON TABLE "public"."view_weekly_position" TO "authenticated";
GRANT ALL ON TABLE "public"."view_weekly_position" TO "service_role";



GRANT ALL ON TABLE "public"."view_weekly_portfolio_value" TO "anon";
GRANT ALL ON TABLE "public"."view_weekly_portfolio_value" TO "authenticated";
GRANT ALL ON TABLE "public"."view_weekly_portfolio_value" TO "service_role";



GRANT ALL ON TABLE "public"."view_current_portfolio_value" TO "anon";
GRANT ALL ON TABLE "public"."view_current_portfolio_value" TO "authenticated";
GRANT ALL ON TABLE "public"."view_current_portfolio_value" TO "service_role";



GRANT ALL ON TABLE "public"."view_current_position" TO "anon";
GRANT ALL ON TABLE "public"."view_current_position" TO "authenticated";
GRANT ALL ON TABLE "public"."view_current_position" TO "service_role";



GRANT ALL ON TABLE "public"."view_daily_activity" TO "anon";
GRANT ALL ON TABLE "public"."view_daily_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."view_daily_activity" TO "service_role";



GRANT ALL ON TABLE "public"."view_portfolio_distribution" TO "anon";
GRANT ALL ON TABLE "public"."view_portfolio_distribution" TO "authenticated";
GRANT ALL ON TABLE "public"."view_portfolio_distribution" TO "service_role";



GRANT ALL ON TABLE "public"."view_portfolio_summary" TO "anon";
GRANT ALL ON TABLE "public"."view_portfolio_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."view_portfolio_summary" TO "service_role";



GRANT ALL ON TABLE "public"."view_profit_distribution" TO "anon";
GRANT ALL ON TABLE "public"."view_profit_distribution" TO "authenticated";
GRANT ALL ON TABLE "public"."view_profit_distribution" TO "service_role";



GRANT ALL ON TABLE "public"."view_weekly_return" TO "anon";
GRANT ALL ON TABLE "public"."view_weekly_return" TO "authenticated";
GRANT ALL ON TABLE "public"."view_weekly_return" TO "service_role";



GRANT ALL ON TABLE "stripe"."active_entitlements" TO "anon";
GRANT ALL ON TABLE "stripe"."active_entitlements" TO "authenticated";
GRANT ALL ON TABLE "stripe"."active_entitlements" TO "service_role";



GRANT ALL ON TABLE "stripe"."charges" TO "anon";
GRANT ALL ON TABLE "stripe"."charges" TO "authenticated";
GRANT ALL ON TABLE "stripe"."charges" TO "service_role";



GRANT ALL ON TABLE "stripe"."checkout_session_line_items" TO "anon";
GRANT ALL ON TABLE "stripe"."checkout_session_line_items" TO "authenticated";
GRANT ALL ON TABLE "stripe"."checkout_session_line_items" TO "service_role";



GRANT ALL ON TABLE "stripe"."checkout_sessions" TO "anon";
GRANT ALL ON TABLE "stripe"."checkout_sessions" TO "authenticated";
GRANT ALL ON TABLE "stripe"."checkout_sessions" TO "service_role";



GRANT ALL ON TABLE "stripe"."coupons" TO "anon";
GRANT ALL ON TABLE "stripe"."coupons" TO "authenticated";
GRANT ALL ON TABLE "stripe"."coupons" TO "service_role";



GRANT ALL ON TABLE "stripe"."credit_notes" TO "anon";
GRANT ALL ON TABLE "stripe"."credit_notes" TO "authenticated";
GRANT ALL ON TABLE "stripe"."credit_notes" TO "service_role";



GRANT ALL ON TABLE "stripe"."customers" TO "anon";
GRANT ALL ON TABLE "stripe"."customers" TO "authenticated";
GRANT ALL ON TABLE "stripe"."customers" TO "service_role";



GRANT ALL ON TABLE "stripe"."disputes" TO "anon";
GRANT ALL ON TABLE "stripe"."disputes" TO "authenticated";
GRANT ALL ON TABLE "stripe"."disputes" TO "service_role";



GRANT ALL ON TABLE "stripe"."early_fraud_warnings" TO "anon";
GRANT ALL ON TABLE "stripe"."early_fraud_warnings" TO "authenticated";
GRANT ALL ON TABLE "stripe"."early_fraud_warnings" TO "service_role";



GRANT ALL ON TABLE "stripe"."events" TO "anon";
GRANT ALL ON TABLE "stripe"."events" TO "authenticated";
GRANT ALL ON TABLE "stripe"."events" TO "service_role";



GRANT ALL ON TABLE "stripe"."features" TO "anon";
GRANT ALL ON TABLE "stripe"."features" TO "authenticated";
GRANT ALL ON TABLE "stripe"."features" TO "service_role";



GRANT ALL ON TABLE "stripe"."invoices" TO "anon";
GRANT ALL ON TABLE "stripe"."invoices" TO "authenticated";
GRANT ALL ON TABLE "stripe"."invoices" TO "service_role";



GRANT ALL ON TABLE "stripe"."migrations" TO "anon";
GRANT ALL ON TABLE "stripe"."migrations" TO "authenticated";
GRANT ALL ON TABLE "stripe"."migrations" TO "service_role";



GRANT ALL ON TABLE "stripe"."payment_intents" TO "anon";
GRANT ALL ON TABLE "stripe"."payment_intents" TO "authenticated";
GRANT ALL ON TABLE "stripe"."payment_intents" TO "service_role";



GRANT ALL ON TABLE "stripe"."payment_methods" TO "anon";
GRANT ALL ON TABLE "stripe"."payment_methods" TO "authenticated";
GRANT ALL ON TABLE "stripe"."payment_methods" TO "service_role";



GRANT ALL ON TABLE "stripe"."payouts" TO "anon";
GRANT ALL ON TABLE "stripe"."payouts" TO "authenticated";
GRANT ALL ON TABLE "stripe"."payouts" TO "service_role";



GRANT ALL ON TABLE "stripe"."plans" TO "anon";
GRANT ALL ON TABLE "stripe"."plans" TO "authenticated";
GRANT ALL ON TABLE "stripe"."plans" TO "service_role";



GRANT ALL ON TABLE "stripe"."prices" TO "anon";
GRANT ALL ON TABLE "stripe"."prices" TO "authenticated";
GRANT ALL ON TABLE "stripe"."prices" TO "service_role";



GRANT ALL ON TABLE "stripe"."products" TO "anon";
GRANT ALL ON TABLE "stripe"."products" TO "authenticated";
GRANT ALL ON TABLE "stripe"."products" TO "service_role";



GRANT ALL ON TABLE "stripe"."refunds" TO "anon";
GRANT ALL ON TABLE "stripe"."refunds" TO "authenticated";
GRANT ALL ON TABLE "stripe"."refunds" TO "service_role";



GRANT ALL ON TABLE "stripe"."reviews" TO "anon";
GRANT ALL ON TABLE "stripe"."reviews" TO "authenticated";
GRANT ALL ON TABLE "stripe"."reviews" TO "service_role";



GRANT ALL ON TABLE "stripe"."setup_intents" TO "anon";
GRANT ALL ON TABLE "stripe"."setup_intents" TO "authenticated";
GRANT ALL ON TABLE "stripe"."setup_intents" TO "service_role";



GRANT ALL ON TABLE "stripe"."subscription_items" TO "anon";
GRANT ALL ON TABLE "stripe"."subscription_items" TO "authenticated";
GRANT ALL ON TABLE "stripe"."subscription_items" TO "service_role";



GRANT ALL ON TABLE "stripe"."subscription_schedules" TO "anon";
GRANT ALL ON TABLE "stripe"."subscription_schedules" TO "authenticated";
GRANT ALL ON TABLE "stripe"."subscription_schedules" TO "service_role";



GRANT ALL ON TABLE "stripe"."subscriptions" TO "anon";
GRANT ALL ON TABLE "stripe"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "stripe"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "stripe"."tax_ids" TO "anon";
GRANT ALL ON TABLE "stripe"."tax_ids" TO "authenticated";
GRANT ALL ON TABLE "stripe"."tax_ids" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "stripe" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "stripe" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "stripe" GRANT ALL ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "stripe" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "stripe" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "stripe" GRANT ALL ON FUNCTIONS TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "stripe" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "stripe" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "stripe" GRANT ALL ON TABLES TO "service_role";



























RESET ALL;
