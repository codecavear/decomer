-- Add delivery hours fields to user profile
ALTER TABLE "decomer_users" ADD COLUMN IF NOT EXISTS "delivery_hours_from" text;
ALTER TABLE "decomer_users" ADD COLUMN IF NOT EXISTS "delivery_hours_to" text;
