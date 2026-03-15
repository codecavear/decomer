-- Add Cloudinary public_id columns for image cleanup (stores + products)
-- Safe to run: uses IF NOT EXISTS so already-migrated DBs are unchanged.

ALTER TABLE "decomer_stores" ADD COLUMN IF NOT EXISTS "logo_public_id" text;
ALTER TABLE "decomer_stores" ADD COLUMN IF NOT EXISTS "banner_public_id" text;
ALTER TABLE "decomer_products" ADD COLUMN IF NOT EXISTS "image_public_id" text;
