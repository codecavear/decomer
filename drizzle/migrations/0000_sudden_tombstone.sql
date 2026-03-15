CREATE TABLE "decomer_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"icon" text,
	"parent_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decomer_store_categories" (
	"store_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "decomer_store_categories_store_id_category_id_pk" PRIMARY KEY("store_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "decomer_favorites" (
	"user_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "decomer_favorites_user_id_store_id_pk" PRIMARY KEY("user_id","store_id")
);
--> statement-breakpoint
CREATE TABLE "decomer_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"avatar_url" text,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "decomer_users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "decomer_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "decomer_store_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"type" text NOT NULL,
	"value" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decomer_store_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"country" text NOT NULL,
	"latitude" numeric(10, 8) NOT NULL,
	"longitude" numeric(11, 8) NOT NULL,
	"neighborhood" text,
	"apartment" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decomer_store_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"open_time" time,
	"close_time" time,
	"is_closed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decomer_stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"logo_url" text,
	"banner_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decomer_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"image_url" text,
	"is_available" boolean DEFAULT true NOT NULL,
	"category" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decomer_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decomer_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decomer_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"delivery_type" text NOT NULL,
	"delivery_address" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "decomer_store_categories" ADD CONSTRAINT "decomer_store_categories_store_id_decomer_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."decomer_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decomer_store_categories" ADD CONSTRAINT "decomer_store_categories_category_id_decomer_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."decomer_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decomer_favorites" ADD CONSTRAINT "decomer_favorites_user_id_decomer_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."decomer_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decomer_favorites" ADD CONSTRAINT "decomer_favorites_store_id_decomer_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."decomer_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decomer_store_contacts" ADD CONSTRAINT "decomer_store_contacts_store_id_decomer_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."decomer_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decomer_store_locations" ADD CONSTRAINT "decomer_store_locations_store_id_decomer_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."decomer_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decomer_store_schedules" ADD CONSTRAINT "decomer_store_schedules_store_id_decomer_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."decomer_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decomer_stores" ADD CONSTRAINT "decomer_stores_owner_id_decomer_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."decomer_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decomer_products" ADD CONSTRAINT "decomer_products_store_id_decomer_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."decomer_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decomer_reviews" ADD CONSTRAINT "decomer_reviews_user_id_decomer_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."decomer_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decomer_reviews" ADD CONSTRAINT "decomer_reviews_store_id_decomer_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."decomer_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decomer_order_items" ADD CONSTRAINT "decomer_order_items_order_id_decomer_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."decomer_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decomer_order_items" ADD CONSTRAINT "decomer_order_items_product_id_decomer_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."decomer_products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decomer_orders" ADD CONSTRAINT "decomer_orders_user_id_decomer_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."decomer_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decomer_orders" ADD CONSTRAINT "decomer_orders_store_id_decomer_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."decomer_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_idx" ON "decomer_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "categories_parent_idx" ON "decomer_categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "store_categories_category_idx" ON "decomer_store_categories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "favorites_store_idx" ON "decomer_favorites" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "store_contacts_store_idx" ON "decomer_store_contacts" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "store_locations_store_idx" ON "decomer_store_locations" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "store_locations_coordinates_idx" ON "decomer_store_locations" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "store_schedules_store_idx" ON "decomer_store_schedules" USING btree ("store_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stores_slug_idx" ON "decomer_stores" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "stores_owner_idx" ON "decomer_stores" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "stores_status_idx" ON "decomer_stores" USING btree ("status");--> statement-breakpoint
CREATE INDEX "products_store_idx" ON "decomer_products" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "products_available_idx" ON "decomer_products" USING btree ("is_available");--> statement-breakpoint
CREATE INDEX "reviews_user_idx" ON "decomer_reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reviews_store_idx" ON "decomer_reviews" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "reviews_rating_idx" ON "decomer_reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "decomer_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_product_idx" ON "decomer_order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "decomer_orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_store_idx" ON "decomer_orders" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "decomer_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_created_idx" ON "decomer_orders" USING btree ("created_at");