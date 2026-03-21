-- Add dietary_preferences and disliked_ingredients to users table
ALTER TABLE "decomer_users" ADD COLUMN "dietary_preferences" jsonb DEFAULT '[]';
ALTER TABLE "decomer_users" ADD COLUMN "disliked_ingredients" jsonb DEFAULT '[]';

-- Create meal plans table
CREATE TABLE "decomer_meal_plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "description" text,
  "price_weekly" decimal(10, 2) NOT NULL,
  "price_monthly" decimal(10, 2) NOT NULL,
  "trial_discount_percent" integer DEFAULT 20 NOT NULL,
  "meals_per_week" integer NOT NULL,
  "can_customize" boolean DEFAULT false NOT NULL,
  "includes_delivery" boolean DEFAULT true NOT NULL,
  "priority_delivery" boolean DEFAULT false NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "meal_plans_type_idx" ON "decomer_meal_plans" ("type");
CREATE INDEX "meal_plans_active_idx" ON "decomer_meal_plans" ("is_active");

-- Create user meal subscriptions table
CREATE TABLE "decomer_user_meal_subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "decomer_users"("id") ON DELETE CASCADE,
  "plan_id" uuid NOT NULL REFERENCES "decomer_meal_plans"("id"),
  "status" text DEFAULT 'active' NOT NULL,
  "frequency" text DEFAULT 'weekly' NOT NULL,
  "current_period_start" timestamp NOT NULL,
  "current_period_end" timestamp NOT NULL,
  "is_trial_period" boolean DEFAULT false NOT NULL,
  "trial_start" timestamp,
  "trial_end" timestamp,
  "paused_at" timestamp,
  "pause_reason" text,
  "cancelled_at" timestamp,
  "cancel_reason" text,
  "will_cancel_at" timestamp,
  "mercadopago_subscription_id" text UNIQUE,
  "mercadopago_customer_id" text,
  "last_payment_id" text,
  "last_payment_status" text,
  "preferred_delivery_day" integer,
  "delivery_time_slot" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "user_meal_subscriptions_user_idx" ON "decomer_user_meal_subscriptions" ("user_id");
CREATE INDEX "user_meal_subscriptions_status_idx" ON "decomer_user_meal_subscriptions" ("status");
CREATE INDEX "user_meal_subscriptions_period_end_idx" ON "decomer_user_meal_subscriptions" ("current_period_end");
CREATE INDEX "user_meal_subscriptions_mp_subscription_idx" ON "decomer_user_meal_subscriptions" ("mercadopago_subscription_id");

-- Create subscription history table
CREATE TABLE "decomer_subscription_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "subscription_id" uuid NOT NULL REFERENCES "decomer_user_meal_subscriptions"("id") ON DELETE CASCADE,
  "action" text NOT NULL,
  "from_plan_id" uuid REFERENCES "decomer_meal_plans"("id"),
  "to_plan_id" uuid REFERENCES "decomer_meal_plans"("id"),
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "subscription_history_subscription_idx" ON "decomer_subscription_history" ("subscription_id");
CREATE INDEX "subscription_history_created_idx" ON "decomer_subscription_history" ("created_at");

-- Create subscription orders table
CREATE TABLE "decomer_subscription_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "decomer_users"("id") ON DELETE CASCADE,
  "subscription_id" uuid REFERENCES "decomer_user_meal_subscriptions"("id") ON DELETE SET NULL,
  "type" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "subtotal" decimal(10, 2) NOT NULL,
  "discount" decimal(10, 2) DEFAULT '0' NOT NULL,
  "delivery_fee" decimal(10, 2) DEFAULT '0' NOT NULL,
  "total" decimal(10, 2) NOT NULL,
  "delivery_address" text NOT NULL,
  "delivery_neighborhood" text,
  "delivery_date" timestamp NOT NULL,
  "delivery_time_slot" text,
  "delivery_notes" text,
  "payment_method" text NOT NULL,
  "payment_status" text DEFAULT 'pending' NOT NULL,
  "paid_at" timestamp,
  "mercadopago_payment_id" text UNIQUE,
  "mercadopago_preference_id" text,
  "mercadopago_status" text,
  "prepared_at" timestamp,
  "delivered_at" timestamp,
  "cancelled_at" timestamp,
  "cancel_reason" text,
  "customer_notes" text,
  "kitchen_notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "subscription_orders_user_idx" ON "decomer_subscription_orders" ("user_id");
CREATE INDEX "subscription_orders_subscription_idx" ON "decomer_subscription_orders" ("subscription_id");
CREATE INDEX "subscription_orders_status_idx" ON "decomer_subscription_orders" ("status");
CREATE INDEX "subscription_orders_delivery_date_idx" ON "decomer_subscription_orders" ("delivery_date");
CREATE INDEX "subscription_orders_payment_status_idx" ON "decomer_subscription_orders" ("payment_status");
CREATE INDEX "subscription_orders_mp_payment_idx" ON "decomer_subscription_orders" ("mercadopago_payment_id");

-- Create subscription order items table
CREATE TABLE "decomer_subscription_order_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL REFERENCES "decomer_subscription_orders"("id") ON DELETE CASCADE,
  "vianda_id" uuid NOT NULL REFERENCES "decomer_viandas"("id") ON DELETE RESTRICT,
  "quantity" integer NOT NULL,
  "unit_price" decimal(10, 2) NOT NULL,
  "subtotal" decimal(10, 2) NOT NULL,
  "vianda_snapshot" jsonb,
  "customer_notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "subscription_order_items_order_idx" ON "decomer_subscription_order_items" ("order_id");
CREATE INDEX "subscription_order_items_vianda_idx" ON "decomer_subscription_order_items" ("vianda_id");

-- Insert default meal plans
INSERT INTO "decomer_meal_plans" ("type", "name", "description", "price_weekly", "price_monthly", "meals_per_week", "can_customize", "includes_delivery", "priority_delivery", "display_order") VALUES
('basico', 'Plan Básico', '5 viandas semanales, menú fijo, delivery estándar', 2500.00, 9000.00, 5, false, true, false, 1),
('full', 'Plan Full', '10 viandas semanales, menú personalizable, delivery estándar', 4500.00, 16000.00, 10, true, true, false, 2),
('premium', 'Plan Premium', '14 viandas semanales, menú personalizable, delivery prioritario', 6000.00, 21000.00, 14, true, true, true, 3);
