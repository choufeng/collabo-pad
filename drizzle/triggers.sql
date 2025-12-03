-- PostgreSQL Triggers for Real-time SSE Notifications
-- ==============================================
-- This script sets up automatic notifications for topic changes
-- using PostgreSQL's LISTEN/NOTIFY mechanism

-- 1. Core Trigger Function and Trigger
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

-- Trigger to automatically notify on topic changes
CREATE TRIGGER topic_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON topics
FOR EACH ROW
EXECUTE FUNCTION notify_topic_change();

-- 2. Utility Functions
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

-- 3. Performance Indexes
-- Index for quick lookup of topics by channel and update time
CREATE INDEX IF NOT EXISTS idx_topics_channel_updated
ON topics USING btree (channel_id, updated_at DESC);

-- Index for finding recent topics in a channel
CREATE INDEX IF NOT EXISTS idx_topics_channel_created_desc
ON topics USING btree (channel_id, created_at DESC);

-- Index for parent-child relationship queries
CREATE INDEX IF NOT EXISTS idx_topics_parent_created
ON topics USING btree (parent_id, created_at DESC);

-- 4. Notification-Friendly Views
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

-- Setup Complete!
-- You can now listen for notifications on channels using:
-- LISTEN 'topic_channel_<channel_id>';

-- Example usage:
-- SELECT * FROM topic_notifications WHERE channel_id = 'your-channel-id';
-- SELECT trigger_topic_notification('your-topic-id');