ALTER TABLE "public_family_tree_visits" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "public_family_tree_visits" CASCADE;--> statement-breakpoint
ALTER TABLE "family_trees" ADD COLUMN "visit_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "public_visit_rank_idx" ON "family_trees" USING btree ("is_public","visit_count","created_at","id");