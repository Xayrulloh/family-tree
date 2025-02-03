CREATE TYPE "public"."fcm_token_device_type" AS ENUM('ANDROID', 'IOS', 'WEB');--> statement-breakpoint
CREATE TYPE "public"."user_gender" AS ENUM('MALE', 'FEMALE');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fcm_tokens" (
	"token" text NOT NULL,
	"user_id" uuid NOT NULL,
	"device_type" "fcm_token_device_type" NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "family_members" (
	"name" text NOT NULL,
	"family_tree_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_id" uuid,
	"spouse_id" uuid,
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "family_trees" (
	"name" text NOT NULL,
	"created_by" uuid NOT NULL,
	"image" text,
	"visibility" boolean DEFAULT false NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"username" text,
	"name" text NOT NULL,
	"image" text,
	"gender" "user_gender" NOT NULL,
	"alive" boolean DEFAULT true NOT NULL,
	"birthdate" timestamp,
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fcm_tokens" ADD CONSTRAINT "fcm_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "family_members" ADD CONSTRAINT "family_members_family_tree_id_family_trees_id_fk" FOREIGN KEY ("family_tree_id") REFERENCES "public"."family_trees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "family_members" ADD CONSTRAINT "family_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "family_members" ADD CONSTRAINT "family_members_parent_id_family_members_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."family_members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "family_members" ADD CONSTRAINT "family_members_spouse_id_users_id_fk" FOREIGN KEY ("spouse_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "family_trees" ADD CONSTRAINT "family_trees_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
