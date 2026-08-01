CREATE TABLE "public_family_tree_visits" (
	"family_tree_id" uuid PRIMARY KEY NOT NULL,
	"visit_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_reads" ADD PRIMARY KEY ("user_id");--> statement-breakpoint
ALTER TABLE "public_family_tree_visits" ADD CONSTRAINT "public_family_tree_visits_family_tree_id_family_trees_id_fk" FOREIGN KEY ("family_tree_id") REFERENCES "public"."family_trees"("id") ON DELETE cascade ON UPDATE no action;