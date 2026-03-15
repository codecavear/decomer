CREATE TABLE "decomer_store_products" (
	"product_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "decomer_store_products_product_id_store_id_pk" PRIMARY KEY("product_id","store_id")
);
--> statement-breakpoint
CREATE TABLE "decomer_magic_link_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "decomer_magic_link_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "decomer_users" ALTER COLUMN "google_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "decomer_users" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "decomer_store_products" ADD CONSTRAINT "decomer_store_products_product_id_decomer_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."decomer_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decomer_store_products" ADD CONSTRAINT "decomer_store_products_store_id_decomer_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."decomer_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "store_products_store_idx" ON "decomer_store_products" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "store_products_available_idx" ON "decomer_store_products" USING btree ("store_id","is_available");