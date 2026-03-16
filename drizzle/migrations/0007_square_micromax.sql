CREATE TABLE "decomer_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"preference_id" text,
	"payment_id" text,
	"external_reference" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"status_detail" text,
	"provider" text DEFAULT 'mercadopago' NOT NULL,
	"init_point" text,
	"sandbox_init_point" text,
	"buyer_email" text,
	"buyer_name" text,
	"webhook_events" text,
	"last_webhook_at" timestamp,
	"paid_at" timestamp,
	"refunded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decomer_viandas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"image_url" text,
	"image_public_id" text,
	"calories" integer,
	"protein" numeric(5, 1),
	"carbs" numeric(5, 1),
	"fats" numeric(5, 1),
	"is_vegetarian" boolean DEFAULT false NOT NULL,
	"is_vegan" boolean DEFAULT false NOT NULL,
	"is_gluten_free" boolean DEFAULT false NOT NULL,
	"is_low_carb" boolean DEFAULT false NOT NULL,
	"is_high_protein" boolean DEFAULT false NOT NULL,
	"ingredients" jsonb,
	"is_available" boolean DEFAULT true NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "decomer_viandas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "decomer_weekly_menu_viandas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"weekly_menu_id" uuid NOT NULL,
	"vianda_id" uuid NOT NULL,
	"day_of_week" integer,
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decomer_weekly_menus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_start" timestamp NOT NULL,
	"week_end" timestamp NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "decomer_orders" ADD COLUMN "payment_status" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "decomer_payments" ADD CONSTRAINT "decomer_payments_order_id_decomer_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."decomer_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decomer_payments" ADD CONSTRAINT "decomer_payments_user_id_decomer_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."decomer_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decomer_payments" ADD CONSTRAINT "decomer_payments_store_id_decomer_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."decomer_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decomer_weekly_menu_viandas" ADD CONSTRAINT "decomer_weekly_menu_viandas_weekly_menu_id_decomer_weekly_menus_id_fk" FOREIGN KEY ("weekly_menu_id") REFERENCES "public"."decomer_weekly_menus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decomer_weekly_menu_viandas" ADD CONSTRAINT "decomer_weekly_menu_viandas_vianda_id_decomer_viandas_id_fk" FOREIGN KEY ("vianda_id") REFERENCES "public"."decomer_viandas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payments_order_idx" ON "decomer_payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payments_user_idx" ON "decomer_payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payments_store_idx" ON "decomer_payments" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "decomer_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_preference_idx" ON "decomer_payments" USING btree ("preference_id");--> statement-breakpoint
CREATE INDEX "payments_payment_idx" ON "decomer_payments" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "payments_external_ref_idx" ON "decomer_payments" USING btree ("external_reference");--> statement-breakpoint
CREATE INDEX "payments_created_idx" ON "decomer_payments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "viandas_slug_idx" ON "decomer_viandas" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "viandas_available_idx" ON "decomer_viandas" USING btree ("is_available");--> statement-breakpoint
CREATE INDEX "viandas_vegetarian_idx" ON "decomer_viandas" USING btree ("is_vegetarian");--> statement-breakpoint
CREATE INDEX "viandas_gluten_free_idx" ON "decomer_viandas" USING btree ("is_gluten_free");--> statement-breakpoint
CREATE INDEX "viandas_low_carb_idx" ON "decomer_viandas" USING btree ("is_low_carb");--> statement-breakpoint
CREATE INDEX "viandas_high_protein_idx" ON "decomer_viandas" USING btree ("is_high_protein");--> statement-breakpoint
CREATE INDEX "weekly_menu_viandas_menu_idx" ON "decomer_weekly_menu_viandas" USING btree ("weekly_menu_id");--> statement-breakpoint
CREATE INDEX "weekly_menu_viandas_vianda_idx" ON "decomer_weekly_menu_viandas" USING btree ("vianda_id");--> statement-breakpoint
CREATE INDEX "weekly_menu_viandas_day_idx" ON "decomer_weekly_menu_viandas" USING btree ("day_of_week");--> statement-breakpoint
CREATE INDEX "weekly_menus_active_idx" ON "decomer_weekly_menus" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "weekly_menus_week_start_idx" ON "decomer_weekly_menus" USING btree ("week_start");--> statement-breakpoint
CREATE INDEX "orders_payment_status_idx" ON "decomer_orders" USING btree ("payment_status");