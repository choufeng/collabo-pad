/**
 * PostgreSQL Triggers for Real-time SSE Notifications
 *
 * This module provides SQL triggers and functions that automatically
 * send notifications when topics are created, updated, or deleted.
 * These notifications use PostgreSQL's LISTEN/NOTIFY mechanism to
 * enable real-time Server-Sent Events without external dependencies.
 */

/**
 * Creates the notification function that will be called by the trigger.
 * This function sends a JSON payload to a channel-specific notification.
 */
export function createTriggerFunction(): string {
  return `
-- Function to send notifications when topics change
CREATE OR REPLACE FUNCTION notify_topic_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'topic_channel_' || COALESCE(NEW.channel_id, OLD.channel_id),
    json_build_object(
      'type', TG_OP,
      'id', COALESCE(NEW.id, OLD.id),
      'channelId', COALESCE(NEW.channel_id, OLD.channel_id),
      'parentId', COALESCE(NEW.parent_id, OLD.parent_id),
      'timestamp', EXTRACT(EPOCH FROM NOW())::BIGINT
    )::text
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
  `.trim();
}

/**
 * Creates the trigger that calls the notification function.
 * This trigger fires on INSERT, UPDATE, and DELETE operations on the topics table.
 */
export function createTopicChangeTrigger(): string {
  return `
-- Trigger to automatically notify on topic changes
CREATE TRIGGER topic_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON topics
FOR EACH ROW
EXECUTE FUNCTION notify_topic_change();
  `.trim();
}

/**
 * Generates a complete setup script that includes both the function and trigger.
 * This can be executed directly against the database to set up real-time notifications.
 */
export function generateTriggerSetupScript(): string {
  const functionSQL = createTriggerFunction();
  const triggerSQL = createTopicChangeTrigger();

  return `
-- PostgreSQL Triggers for Real-time Topic Notifications
-- This script sets up automatic notifications for topic changes

${functionSQL};

${triggerSQL};
  `.trim();
}

/**
 * Generates SQL to clean up triggers and functions.
 * Useful for testing or when you need to reset the notification system.
 */
export function cleanupTriggers(): string {
  return `
-- Clean up topic change triggers and functions
DROP TRIGGER IF EXISTS topic_change_trigger ON topics;
DROP FUNCTION IF EXISTS notify_topic_change();
  `.trim();
}

/**
 * Creates additional utility functions for notification management.
 */
export function createNotificationUtilities(): string {
  return `
-- Utility functions for notification management

-- Function to manually trigger a notification for a specific topic
CREATE OR REPLACE FUNCTION trigger_topic_notification(topic_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  topic_record RECORD;
BEGIN
  SELECT id, channel_id, parent_id INTO topic_record
  FROM topics
  WHERE id = topic_id;

  IF FOUND THEN
    PERFORM pg_notify(
      'topic_channel_' || topic_record.channel_id,
      json_build_object(
        'type', 'MANUAL',
        'id', topic_record.id,
        'channelId', topic_record.channel_id,
        'parentId', topic_record.parent_id,
        'timestamp', EXTRACT(EPOCH FROM NOW())::BIGINT
      )::text
    );
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get notification statistics for a channel
CREATE OR REPLACE FUNCTION get_notification_stats(channel_id UUID)
RETURNS JSON AS $$
DECLARE
  total_topics INTEGER;
  recent_topics INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_topics
  FROM topics
  WHERE channel_id = get_notification_stats.channel_id;

  SELECT COUNT(*) INTO recent_topics
  FROM topics
  WHERE channel_id = get_notification_stats.channel_id
    AND created_at > NOW() - INTERVAL '1 hour';

  RETURN json_build_object(
    'channelId', channel_id,
    'totalTopics', total_topics,
    'recentTopics', recent_topics,
    'asOf', NOW()
  );
END;
$$ LANGUAGE plpgsql;
  `.trim();
}

/**
 * Creates indexes to support the notification system.
 * These indexes improve performance for queries that might be used
 * in conjunction with the notification system.
 */
export function createNotificationIndexes(): string {
  return `
-- Additional indexes to support notification system performance

-- Index for quick lookup of topics by channel and update time
CREATE INDEX IF NOT EXISTS idx_topics_channel_updated
ON topics USING btree (channel_id, updated_at DESC);

-- Index for finding recent topics in a channel
CREATE INDEX IF NOT EXISTS idx_topics_channel_created_desc
ON topics USING btree (channel_id, created_at DESC);

-- Index for parent-child relationship queries
CREATE INDEX IF NOT EXISTS idx_topics_parent_created
ON topics USING btree (parent_id, created_at DESC);
  `.trim();
}

/**
 * Creates views for notification-friendly data access.
 * These views provide pre-formatted data that's commonly used
 * in notification payloads.
 */
export function createNotificationViews(): string {
  return `
-- Views for notification-friendly data access

-- View with topics formatted for SSE notifications
CREATE OR REPLACE VIEW topic_notifications AS
SELECT
  id,
  channel_id as "channelId",
  parent_id as "parentId",
  user_id as "userId",
  username,
  content,
  x,
  y,
  w,
  h,
  metadata,
  tags,
  created_at as "createdAt",
  updated_at as "updatedAt",
  EXTRACT(EPOCH FROM updated_at)::BIGINT as "lastModified"
FROM topics;

-- View with topic hierarchy information
CREATE OR REPLACE VIEW topic_hierarchy AS
SELECT
  t.id,
  t.channel_id as "channelId",
  t.parent_id as "parentId",
  t.username,
  t.content,
  t.created_at as "createdAt",
  -- Count of direct children
  (SELECT COUNT(*) FROM topics ct WHERE ct.parent_id = t.id) as "childCount",
  -- Count of all descendants
  WITH RECURSIVE descendants AS (
    SELECT id FROM topics WHERE parent_id = t.id
    UNION ALL
    SELECT topics.id FROM topics
    INNER JOIN descendants ON topics.parent_id = descendants.id
  )
  SELECT COUNT(*) FROM descendants as "descendantCount"
FROM topics t;
  `.trim();
}

/**
 * Complete setup script for the entire notification system.
 * This includes functions, triggers, indexes, and views.
 */
export function generateCompleteNotificationSetup(): string {
  const setupScript = generateTriggerSetupScript();
  const utilitiesSQL = createNotificationUtilities();
  const indexesSQL = createNotificationIndexes();
  const viewsSQL = createNotificationViews();

  return `
-- Complete PostgreSQL Notification System Setup
-- ==============================================
-- This script sets up a comprehensive notification system for real-time SSE

-- 1. Core Trigger Function and Trigger
${setupScript}

-- 2. Utility Functions
${utilitiesSQL}

-- 3. Performance Indexes
${indexesSQL}

-- 4. Notification-Friendly Views
${viewsSQL}

-- Setup Complete!
-- You can now listen for notifications on channels using:
-- LISTEN 'topic_channel_<channel_id>';

-- Example usage:
-- SELECT * FROM topic_notifications WHERE channel_id = 'your-channel-id';
-- SELECT trigger_topic_notification('your-topic-id');
-- SELECT * FROM get_notification_stats('your-channel-id');
  `.trim();
}

/**
 * Generates migration-safe SQL that checks for existing objects
 * before creating new ones. This is useful for database migrations.
 */
export function generateMigrationSafeSetup(): string {
  return `
-- Migration-Safe Notification System Setup
-- ===========================================

-- Create the notification function only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'notify_topic_change'
  ) THEN
    EXECUTE $${createTriggerFunction().replace(/'/g, "$''")}$;
    RAISE NOTICE 'Created notify_topic_change function';
  END IF;
END $$;

-- Create the trigger only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'topic_change_trigger'
  ) THEN
    EXECUTE $${createTopicChangeTrigger().replace(/'/g, "$''")}$;
    RAISE NOTICE 'Created topic_change_trigger';
  END IF;
END $$;

-- Create indexes with IF NOT EXISTS
${createNotificationIndexes()}

-- Create views with OR REPLACE
${createNotificationViews()}

-- Migration completed successfully!
  `.trim();
}
