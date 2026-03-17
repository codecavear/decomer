CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"channel" varchar(20) NOT NULL,
	"type" varchar(50) NOT NULL,
	"to" varchar(100) NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"external_id" varchar(100),
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp,
	"delivered_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_decomer_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."decomer_users"("id") ON DELETE no action ON UPDATE no action;