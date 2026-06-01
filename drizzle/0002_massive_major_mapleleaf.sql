ALTER TABLE "goals" ADD COLUMN "linked_metric" text;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "target_value" integer;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "linked_ref" text;