CREATE TABLE IF NOT EXISTS "users" (
	"username" text NOT NULL,
	"name" text NOT NULL,
	"surname" text NOT NULL,
	"alive" boolean DEFAULT true NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
