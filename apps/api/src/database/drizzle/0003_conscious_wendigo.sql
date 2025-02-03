ALTER TABLE "users" RENAME COLUMN "birthdate" TO "birth_date";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "death_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "alive";