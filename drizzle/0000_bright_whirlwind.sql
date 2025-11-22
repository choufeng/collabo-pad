CREATE TABLE "topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" uuid NOT NULL,
	"parent_id" uuid,
	"user_id" uuid NOT NULL,
	"username" text NOT NULL,
	"content" text NOT NULL,
	"x" numeric(10, 2),
	"y" numeric(10, 2),
	"w" numeric(10, 2),
	"h" numeric(10, 2),
	"metadata" json,
	"tags" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "idx_topics_channel_id" ON "topics" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "idx_topics_parent_id" ON "topics" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_topics_user_id" ON "topics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_topics_created_at" ON "topics" USING btree ("created_at");