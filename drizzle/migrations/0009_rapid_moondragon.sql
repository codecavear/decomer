CREATE TABLE "decomer_push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "decomer_push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
ALTER TABLE "decomer_users" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "decomer_users" ADD COLUMN "delivery_address" text;--> statement-breakpoint
ALTER TABLE "decomer_users" ADD COLUMN "delivery_neighborhood" text;--> statement-breakpoint
ALTER TABLE "decomer_users" ADD COLUMN "delivery_notes" text;--> statement-breakpoint
ALTER TABLE "decomer_users" ADD COLUMN "allergies" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "decomer_users" ADD COLUMN "preferences" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "decomer_products" ADD COLUMN "calories" integer;--> statement-breakpoint
ALTER TABLE "decomer_products" ADD COLUMN "protein" numeric(5, 1);--> statement-breakpoint
ALTER TABLE "decomer_products" ADD COLUMN "carbs" numeric(5, 1);--> statement-breakpoint
ALTER TABLE "decomer_products" ADD COLUMN "fat" numeric(5, 1);--> statement-breakpoint
ALTER TABLE "decomer_products" ADD COLUMN "fiber" numeric(5, 1);--> statement-breakpoint
ALTER TABLE "decomer_products" ADD COLUMN "ingredients" text;--> statement-breakpoint
ALTER TABLE "decomer_products" ADD COLUMN "allergens" text;--> statement-breakpoint
ALTER TABLE "decomer_products" ADD COLUMN "is_gluten_free" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "decomer_products" ADD COLUMN "is_low_carb" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "decomer_products" ADD COLUMN "is_high_protein" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "decomer_products" ADD COLUMN "is_vegetarian" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "decomer_products" ADD COLUMN "tags" jsonb;--> statement-breakpoint
ALTER TABLE "decomer_push_subscriptions" ADD CONSTRAINT "decomer_push_subscriptions_user_id_decomer_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."decomer_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "products_vegan_idx" ON "decomer_products" USING btree ("is_vegan");--> statement-breakpoint
CREATE INDEX "products_gluten_free_idx" ON "decomer_products" USING btree ("is_gluten_free");--> statement-breakpoint
CREATE INDEX "products_low_carb_idx" ON "decomer_products" USING btree ("is_low_carb");--> statement-breakpoint
CREATE INDEX "products_high_protein_idx" ON "decomer_products" USING btree ("is_high_protein");