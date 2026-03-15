ALTER TABLE "decomer_stores" ADD COLUMN "type" text DEFAULT 'catalog' NOT NULL;--> statement-breakpoint
CREATE INDEX "stores_type_idx" ON "decomer_stores" USING btree ("type");