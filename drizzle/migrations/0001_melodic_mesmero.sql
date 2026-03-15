CREATE TABLE "decomer_store_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"billing_cycle" text DEFAULT 'monthly' NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"external_id" text,
	"external_customer_id" text,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decomer_subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"price_monthly" numeric(10, 2) NOT NULL,
	"price_yearly" numeric(10, 2) NOT NULL,
	"max_products" integer DEFAULT -1 NOT NULL,
	"max_locations" integer DEFAULT 1 NOT NULL,
	"max_images_per_product" integer DEFAULT 1 NOT NULL,
	"features_enabled" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "decomer_subscription_plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "decomer_store_subscriptions" ADD CONSTRAINT "decomer_store_subscriptions_store_id_decomer_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."decomer_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decomer_store_subscriptions" ADD CONSTRAINT "decomer_store_subscriptions_plan_id_decomer_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."decomer_subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "store_subscriptions_store_idx" ON "decomer_store_subscriptions" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "store_subscriptions_status_idx" ON "decomer_store_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "store_subscriptions_period_end_idx" ON "decomer_store_subscriptions" USING btree ("current_period_end");