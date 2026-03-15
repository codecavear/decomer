CREATE TABLE "vegy_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"preference_id" text,
	"payment_id" text,
	"external_reference" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"status_detail" text,
	"provider" text DEFAULT 'mercadopago' NOT NULL,
	"init_point" text,
	"sandbox_init_point" text,
	"buyer_email" text,
	"buyer_name" text,
	"webhook_events" text,
	"last_webhook_at" timestamp,
	"paid_at" timestamp,
	"refunded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vegy_stores" ADD COLUMN "logo_public_id" text;--> statement-breakpoint
ALTER TABLE "vegy_stores" ADD COLUMN "banner_public_id" text;--> statement-breakpoint
ALTER TABLE "vegy_products" ADD COLUMN "image_public_id" text;--> statement-breakpoint
ALTER TABLE "vegy_orders" ADD COLUMN "payment_status" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "vegy_payments" ADD CONSTRAINT "vegy_payments_order_id_vegy_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."vegy_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vegy_payments" ADD CONSTRAINT "vegy_payments_user_id_vegy_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."vegy_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vegy_payments" ADD CONSTRAINT "vegy_payments_store_id_vegy_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."vegy_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payments_order_idx" ON "vegy_payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payments_user_idx" ON "vegy_payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payments_store_idx" ON "vegy_payments" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "vegy_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_preference_idx" ON "vegy_payments" USING btree ("preference_id");--> statement-breakpoint
CREATE INDEX "payments_payment_idx" ON "vegy_payments" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "payments_external_ref_idx" ON "vegy_payments" USING btree ("external_reference");--> statement-breakpoint
CREATE INDEX "payments_created_idx" ON "vegy_payments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_payment_status_idx" ON "vegy_orders" USING btree ("payment_status");