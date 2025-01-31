CREATE TABLE IF NOT EXISTS "family_tree_relationships" (
	"ancestor_id" uuid NOT NULL,
	"descendant_id" uuid NOT NULL,
	"family_tree_id" uuid NOT NULL,
	"depth" integer NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "relationship_pk" UNIQUE("ancestor_id","descendant_id","family_tree_id")
);
--> statement-breakpoint
DROP TABLE "family_members" CASCADE;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "family_tree_relationships" ADD CONSTRAINT "family_tree_relationships_ancestor_id_users_id_fk" FOREIGN KEY ("ancestor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "family_tree_relationships" ADD CONSTRAINT "family_tree_relationships_descendant_id_users_id_fk" FOREIGN KEY ("descendant_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "family_tree_relationships" ADD CONSTRAINT "family_tree_relationships_family_tree_id_family_trees_id_fk" FOREIGN KEY ("family_tree_id") REFERENCES "public"."family_trees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
