-- Migration: Global Product Catalog
-- Products now belong to users instead of stores, with a many-to-many relationship via store_products

-- Step 1: Create the store_products junction table
CREATE TABLE IF NOT EXISTS "decomer_store_products" (
  "product_id" uuid NOT NULL,
  "store_id" uuid NOT NULL,
  "is_available" boolean DEFAULT true NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "decomer_store_products_pkey" PRIMARY KEY("product_id", "store_id")
);

-- Step 2: Add owner_id column to products (nullable first for migration)
ALTER TABLE "decomer_products" ADD COLUMN IF NOT EXISTS "owner_id" uuid;

-- Step 3: Populate owner_id from store ownership
UPDATE "decomer_products" p
SET "owner_id" = s."owner_id"
FROM "decomer_stores" s
WHERE p."store_id" = s."id"
  AND p."owner_id" IS NULL;

-- Step 4: Migrate existing products to store_products junction table
INSERT INTO "decomer_store_products" ("product_id", "store_id", "is_available", "created_at", "updated_at")
SELECT p."id", p."store_id", p."is_available", p."created_at", p."updated_at"
FROM "decomer_products" p
WHERE p."store_id" IS NOT NULL
ON CONFLICT DO NOTHING;

-- Step 5: Make owner_id NOT NULL (all existing products should now have an owner)
ALTER TABLE "decomer_products" ALTER COLUMN "owner_id" SET NOT NULL;

-- Step 6: Add foreign key constraints
ALTER TABLE "decomer_products"
ADD CONSTRAINT "decomer_products_owner_id_decomer_users_id_fk"
FOREIGN KEY ("owner_id") REFERENCES "decomer_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "decomer_store_products"
ADD CONSTRAINT "decomer_store_products_product_id_decomer_products_id_fk"
FOREIGN KEY ("product_id") REFERENCES "decomer_products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "decomer_store_products"
ADD CONSTRAINT "decomer_store_products_store_id_decomer_stores_id_fk"
FOREIGN KEY ("store_id") REFERENCES "decomer_stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Step 7: Create indexes on store_products
CREATE INDEX IF NOT EXISTS "store_products_store_idx" ON "decomer_store_products" USING btree ("store_id");
CREATE INDEX IF NOT EXISTS "store_products_available_idx" ON "decomer_store_products" USING btree ("store_id", "is_available");

-- Step 8: Drop old columns and indexes from products
DROP INDEX IF EXISTS "products_store_idx";
DROP INDEX IF EXISTS "products_available_idx";

ALTER TABLE "decomer_products" DROP CONSTRAINT IF EXISTS "decomer_products_store_id_decomer_stores_id_fk";
ALTER TABLE "decomer_products" DROP COLUMN IF EXISTS "store_id";
ALTER TABLE "decomer_products" DROP COLUMN IF EXISTS "is_available";

-- Step 9: Create new index on products owner
CREATE INDEX IF NOT EXISTS "products_owner_idx" ON "decomer_products" USING btree ("owner_id");
