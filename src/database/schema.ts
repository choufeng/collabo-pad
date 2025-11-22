import {
  pgTable,
  uuid,
  text,
  decimal,
  timestamp,
  json,
  index,
} from "drizzle-orm/pg-core";

// Topics table - stores user topics with spatial positioning and metadata
export const topics = pgTable(
  "topics",
  {
    // Primary identification
    id: uuid("id").primaryKey().defaultRandom(),

    // Relationships
    channelId: text("channel_id").notNull(),
    parentId: uuid("parent_id"),

    // User information
    userId: text("user_id").notNull(),
    username: text("username").notNull(),

    // Content
    content: text("content").notNull(),

    // Spatial positioning for canvas
    x: decimal("x", { precision: 10, scale: 2 }),
    y: decimal("y", { precision: 10, scale: 2 }),

    // Dimensions (width and height)
    w: decimal("w", { precision: 10, scale: 2 }),
    h: decimal("h", { precision: 10, scale: 2 }),

    // Extensible metadata
    metadata: json("metadata").$type<Record<string, any>>(),
    tags: text("tags").array(),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    // Indexes for common query patterns
    channelIdIdx: index("idx_topics_channel_id").on(table.channelId),
    parentIdIdx: index("idx_topics_parent_id").on(table.parentId),
    userIdIdx: index("idx_topics_user_id").on(table.userId),
    createdAtIdx: index("idx_topics_created_at").on(table.createdAt),
  }),
);

// Export table types for TypeScript usage
export type Topic = typeof topics.$inferSelect;
export type NewTopic = typeof topics.$inferInsert;
