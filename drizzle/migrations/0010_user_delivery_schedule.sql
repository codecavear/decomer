-- Migration: DECOMER-10 — User delivery schedule preference
ALTER TABLE "decomer_users" ADD COLUMN IF NOT EXISTS "delivery_schedule" jsonb DEFAULT NULL;
