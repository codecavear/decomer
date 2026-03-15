CREATE TABLE "vegy_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"icon" text,
	"parent_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vegy_store_categories" (
	"store_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vegy_store_categories_store_id_category_id_pk" PRIMARY KEY("store_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "vegy_favorites" (
	"user_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vegy_favorites_user_id_store_id_pk" PRIMARY KEY("user_id","store_id")
);
--> statement-breakpoint
CREATE TABLE "vegy_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"avatar_url" text,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vegy_users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "vegy_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vegy_store_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"type" text NOT NULL,
	"value" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vegy_store_locations" (
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
CREATE TABLE "vegy_store_schedules" (
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
CREATE TABLE "vegy_stores" (
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
CREATE TABLE "vegy_products" (
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
CREATE TABLE "vegy_reviews" (
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
CREATE TABLE "vegy_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vegy_orders" (
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
ALTER TABLE "vegy_store_categories" ADD CONSTRAINT "vegy_store_categories_store_id_vegy_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."vegy_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vegy_store_categories" ADD CONSTRAINT "vegy_store_categories_category_id_vegy_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."vegy_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vegy_favorites" ADD CONSTRAINT "vegy_favorites_user_id_vegy_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."vegy_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vegy_favorites" ADD CONSTRAINT "vegy_favorites_store_id_vegy_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."vegy_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vegy_store_contacts" ADD CONSTRAINT "vegy_store_contacts_store_id_vegy_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."vegy_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vegy_store_locations" ADD CONSTRAINT "vegy_store_locations_store_id_vegy_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."vegy_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vegy_store_schedules" ADD CONSTRAINT "vegy_store_schedules_store_id_vegy_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."vegy_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vegy_stores" ADD CONSTRAINT "vegy_stores_owner_id_vegy_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."vegy_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vegy_products" ADD CONSTRAINT "vegy_products_store_id_vegy_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."vegy_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vegy_reviews" ADD CONSTRAINT "vegy_reviews_user_id_vegy_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."vegy_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vegy_reviews" ADD CONSTRAINT "vegy_reviews_store_id_vegy_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."vegy_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vegy_order_items" ADD CONSTRAINT "vegy_order_items_order_id_vegy_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."vegy_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vegy_order_items" ADD CONSTRAINT "vegy_order_items_product_id_vegy_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."vegy_products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vegy_orders" ADD CONSTRAINT "vegy_orders_user_id_vegy_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."vegy_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vegy_orders" ADD CONSTRAINT "vegy_orders_store_id_vegy_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."vegy_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_idx" ON "vegy_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "categories_parent_idx" ON "vegy_categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "store_categories_category_idx" ON "vegy_store_categories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "favorites_store_idx" ON "vegy_favorites" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "store_contacts_store_idx" ON "vegy_store_contacts" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "store_locations_store_idx" ON "vegy_store_locations" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "store_locations_coordinates_idx" ON "vegy_store_locations" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "store_schedules_store_idx" ON "vegy_store_schedules" USING btree ("store_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stores_slug_idx" ON "vegy_stores" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "stores_owner_idx" ON "vegy_stores" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "stores_status_idx" ON "vegy_stores" USING btree ("status");--> statement-breakpoint
CREATE INDEX "products_store_idx" ON "vegy_products" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "products_available_idx" ON "vegy_products" USING btree ("is_available");--> statement-breakpoint
CREATE INDEX "reviews_user_idx" ON "vegy_reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reviews_store_idx" ON "vegy_reviews" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "reviews_rating_idx" ON "vegy_reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "vegy_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_product_idx" ON "vegy_order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "vegy_orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_store_idx" ON "vegy_orders" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "vegy_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_created_idx" ON "vegy_orders" USING btree ("created_at");