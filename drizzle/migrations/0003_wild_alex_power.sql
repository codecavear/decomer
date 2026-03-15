ALTER TABLE "vegy_stores" ADD COLUMN "type" text DEFAULT 'catalog' NOT NULL;--> statement-breakpoint
CREATE INDEX "stores_type_idx" ON "vegy_stores" USING btree ("type");