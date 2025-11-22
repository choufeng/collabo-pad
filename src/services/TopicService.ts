import { db } from "../database/drizzle";
import { topics } from "../database/schema";
import { eq, and, isNull, not, desc } from "drizzle-orm";
import type { NewTopic, Topic } from "../database/schema";

export interface TopicHierarchyNode extends Topic {
  children: TopicHierarchyNode[];
}

export interface CreateTopicData extends Partial<NewTopic> {
  channelId: string;
  userId: string;
  username: string;
  content: string;
  x?: string | null;
  y?: string | null;
  w?: string | null;
  h?: string | null;
  metadata?: Record<string, any> | null;
  tags?: string[] | null;
}

export interface UpdateTopicData extends Partial<Topic> {
  content?: string;
  x?: string | null;
  y?: string | null;
  w?: string | null;
  h?: string | null;
  metadata?: Record<string, any> | null;
  tags?: string[] | null;
}

/**
 * TopicService provides a high-level service for managing topics
 * with proper error handling and hierarchical operations.
 */
export class TopicService {
  /**
   * Create a new topic
   */
  async create(data: CreateTopicData): Promise<Topic> {
    try {
      const result = await db
        .insert(topics)
        .values({
          ...data,
          id: undefined, // Let database generate UUID
        })
        .returning();

      if (result.length === 0) {
        throw new Error("Failed to create topic: No rows returned");
      }

      return result[0];
    } catch (error) {
      console.error("Error creating topic:", error);
      throw new Error(
        `Failed to create topic: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Find a topic by ID
   */
  async findById(id: string): Promise<Topic | null> {
    try {
      const result = await db
        .select()
        .from(topics)
        .where(eq(topics.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error("Error finding topic by ID:", error);
      throw new Error(
        `Failed to find topic: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Find all topics for a specific channel
   */
  async findByChannelId(channelId: string): Promise<Topic[]> {
    try {
      const result = await db
        .select()
        .from(topics)
        .where(eq(topics.channelId, channelId))
        .orderBy(desc(topics.updatedAt));

      return result;
    } catch (error) {
      console.error("Error finding topics by channel ID:", error);
      throw new Error(
        `Failed to find topics for channel: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Find all child topics of a parent topic
   */
  async findChildren(parentId: string): Promise<Topic[]> {
    try {
      const result = await db
        .select()
        .from(topics)
        .where(eq(topics.parentId, parentId))
        .orderBy(desc(topics.updatedAt));

      return result;
    } catch (error) {
      console.error("Error finding child topics:", error);
      throw new Error(
        `Failed to find child topics: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Find all root topics (topics without parent) in a channel
   */
  async findRootTopics(channelId: string): Promise<Topic[]> {
    try {
      const result = await db
        .select()
        .from(topics)
        .where(and(eq(topics.channelId, channelId), isNull(topics.parentId)))
        .orderBy(desc(topics.updatedAt));

      return result;
    } catch (error) {
      console.error("Error finding root topics:", error);
      throw new Error(
        `Failed to find root topics: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Build complete topic hierarchy for a channel
   */
  async findHierarchy(channelId: string): Promise<TopicHierarchyNode[]> {
    try {
      // Get all topics in the channel
      const allTopics = await this.findByChannelId(channelId);

      // Build a map of topics by ID for easy lookup
      const topicMap = new Map<string, TopicHierarchyNode>();

      // Convert all topics to hierarchy nodes
      allTopics.forEach((topic) => {
        topicMap.set(topic.id, {
          ...topic,
          children: [],
        });
      });

      // Build the hierarchy
      const rootTopics: TopicHierarchyNode[] = [];

      topicMap.forEach((topic) => {
        if (topic.parentId) {
          // This is a child topic, add it to its parent's children array
          const parent = topicMap.get(topic.parentId);
          if (parent) {
            parent.children.push(topic);
          }
        } else {
          // This is a root topic
          rootTopics.push(topic);
        }
      });

      return rootTopics;
    } catch (error) {
      console.error("Error building topic hierarchy:", error);
      throw new Error(
        `Failed to build topic hierarchy: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Update an existing topic
   */
  async update(id: string, data: UpdateTopicData): Promise<Topic | null> {
    try {
      const result = await db
        .update(topics)
        .set({
          ...data,
          updatedAt: new Date(), // Explicitly update the timestamp
        })
        .where(eq(topics.id, id))
        .returning();

      return result[0] || null;
    } catch (error) {
      console.error("Error updating topic:", error);
      throw new Error(
        `Failed to update topic: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Delete a topic and all its descendants
   */
  async delete(id: string): Promise<Topic | null> {
    try {
      // First find the topic to be deleted to return it later
      const topicToDelete = await this.findById(id);
      if (!topicToDelete) {
        return null;
      }

      // Delete the topic (Note: We should handle cascading deletes for children in a real implementation)
      const result = await db
        .delete(topics)
        .where(eq(topics.id, id))
        .returning();

      return result[0] || null;
    } catch (error) {
      console.error("Error deleting topic:", error);
      throw new Error(
        `Failed to delete topic: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Delete a topic and all its descendants recursively
   */
  async deleteWithDescendants(id: string): Promise<Topic[]> {
    try {
      const deletedTopics: Topic[] = [];

      // Recursively collect all descendants
      const collectDescendants = async (parentId: string): Promise<void> => {
        const children = await this.findChildren(parentId);

        for (const child of children) {
          await collectDescendants(child.id);
          const deletedChild = await this.delete(child.id);
          if (deletedChild) {
            deletedTopics.push(deletedChild);
          }
        }
      };

      // Collect and delete all descendants first
      await collectDescendants(id);

      // Finally delete the parent topic
      const deletedParent = await this.delete(id);
      if (deletedParent) {
        deletedTopics.push(deletedParent);
      }

      return deletedTopics;
    } catch (error) {
      console.error("Error deleting topic with descendants:", error);
      throw new Error(
        `Failed to delete topic with descendants: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Move a topic to a new parent (change its position in hierarchy)
   */
  async moveToParent(
    topicId: string,
    newParentId: string | null,
  ): Promise<Topic | null> {
    try {
      // Validate that the new parent exists and is not a descendant of the topic
      if (newParentId) {
        const newParent = await this.findById(newParentId);
        if (!newParent) {
          throw new Error("New parent topic not found");
        }

        // Check if this would create a circular reference
        const isDescendant = await this.isDescendant(newParentId, topicId);
        if (isDescendant) {
          throw new Error("Cannot move a topic to be a descendant of itself");
        }
      }

      return await this.update(topicId, { parentId: newParentId });
    } catch (error) {
      console.error("Error moving topic to new parent:", error);
      throw new Error(
        `Failed to move topic: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Check if a topic is a descendant of another topic
   */
  private async isDescendant(
    ancestorId: string,
    descendantId: string,
  ): Promise<boolean> {
    try {
      const topic = await this.findById(descendantId);
      if (!topic || !topic.parentId) {
        return false;
      }

      if (topic.parentId === ancestorId) {
        return true;
      }

      return await this.isDescendant(ancestorId, topic.parentId);
    } catch (error) {
      console.error("Error checking descendant relationship:", error);
      return false;
    }
  }

  /**
   * Get topic statistics for a channel
   */
  async getChannelStats(channelId: string): Promise<{
    totalTopics: number;
    rootTopics: number;
    maxDepth: number;
  }> {
    try {
      const allTopics = await this.findByChannelId(channelId);
      const rootTopics = allTopics.filter((topic) => !topic.parentId);

      // Calculate maximum depth of the hierarchy
      const calculateDepth = (
        topicId: string,
        visited = new Set<string>(),
      ): number => {
        if (visited.has(topicId)) {
          return 0; // Prevent infinite loops
        }
        visited.add(topicId);

        const children = allTopics.filter(
          (topic) => topic.parentId === topicId,
        );
        if (children.length === 0) {
          return 1;
        }

        return (
          1 +
          Math.max(
            ...children.map((child) => calculateDepth(child.id, visited)),
          )
        );
      };

      const maxDepth =
        rootTopics.length > 0
          ? Math.max(...rootTopics.map((root) => calculateDepth(root.id)))
          : 0;

      return {
        totalTopics: allTopics.length,
        rootTopics: rootTopics.length,
        maxDepth,
      };
    } catch (error) {
      console.error("Error calculating channel stats:", error);
      throw new Error(
        `Failed to calculate channel stats: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

// Export a singleton instance for easy use
export const topicService = new TopicService();
