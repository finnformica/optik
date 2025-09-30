-- Custom SQL migration file, put your code below! --
-- Enable RLS on all stripe schema tables and create policies for authenticated users
-- This ensures that the stripe schema is secured and only accessible to authenticated users

-- Enable RLS on all stripe tables
ALTER TABLE stripe.active_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.checkout_session_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.early_fraud_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.setup_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.subscription_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.tax_ids ENABLE ROW LEVEL SECURITY;

-- Create policies that allow authenticated users to perform all operations
-- This gives full access to authenticated users while blocking anonymous access

-- Active Entitlements
CREATE POLICY "authenticated_full_access_active_entitlements" ON stripe.active_entitlements
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Charges
CREATE POLICY "authenticated_full_access_charges" ON stripe.charges
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Checkout Session Line Items
CREATE POLICY "authenticated_full_access_checkout_session_line_items" ON stripe.checkout_session_line_items
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Checkout Sessions
CREATE POLICY "authenticated_full_access_checkout_sessions" ON stripe.checkout_sessions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Coupons
CREATE POLICY "authenticated_full_access_coupons" ON stripe.coupons
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Credit Notes
CREATE POLICY "authenticated_full_access_credit_notes" ON stripe.credit_notes
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Customers
CREATE POLICY "authenticated_full_access_customers" ON stripe.customers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Disputes
CREATE POLICY "authenticated_full_access_disputes" ON stripe.disputes
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Early Fraud Warnings
CREATE POLICY "authenticated_full_access_early_fraud_warnings" ON stripe.early_fraud_warnings
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Events
CREATE POLICY "authenticated_full_access_events" ON stripe.events
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Features
CREATE POLICY "authenticated_full_access_features" ON stripe.features
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Invoices
CREATE POLICY "authenticated_full_access_invoices" ON stripe.invoices
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Migrations (for stripe sync engine)
CREATE POLICY "authenticated_full_access_migrations" ON stripe.migrations
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Payment Intents
CREATE POLICY "authenticated_full_access_payment_intents" ON stripe.payment_intents
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Payment Methods
CREATE POLICY "authenticated_full_access_payment_methods" ON stripe.payment_methods
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Payouts
CREATE POLICY "authenticated_full_access_payouts" ON stripe.payouts
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Plans
CREATE POLICY "authenticated_full_access_plans" ON stripe.plans
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Prices
CREATE POLICY "authenticated_full_access_prices" ON stripe.prices
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Products
CREATE POLICY "authenticated_full_access_products" ON stripe.products
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Refunds
CREATE POLICY "authenticated_full_access_refunds" ON stripe.refunds
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Reviews
CREATE POLICY "authenticated_full_access_reviews" ON stripe.reviews
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Setup Intents
CREATE POLICY "authenticated_full_access_setup_intents" ON stripe.setup_intents
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Subscription Items
CREATE POLICY "authenticated_full_access_subscription_items" ON stripe.subscription_items
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Subscription Schedules
CREATE POLICY "authenticated_full_access_subscription_schedules" ON stripe.subscription_schedules
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Subscriptions
CREATE POLICY "authenticated_full_access_subscriptions" ON stripe.subscriptions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tax IDs
CREATE POLICY "authenticated_full_access_tax_ids" ON stripe.tax_ids
    FOR ALL TO authenticated USING (true) WITH CHECK (true);