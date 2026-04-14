-- ============================================================
-- University Communication Platform (Teams-lite)
-- PostgreSQL Schema
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');

CREATE TYPE conversation_type AS ENUM ('direct', 'group');

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name      VARCHAR(100)        NOT NULL,
    last_name       VARCHAR(100)        NOT NULL,
    email           VARCHAR(255)        NOT NULL UNIQUE,
    password_hash   TEXT                NOT NULL,
    role            user_role           NOT NULL,
    group_name      VARCHAR(100),                   -- e.g. "G1", "G2" (relevant for students)
    specialty       VARCHAR(150),                   -- e.g. "Computer Science"
    is_active       BOOLEAN             NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role        ON users (role);
CREATE INDEX idx_users_group       ON users (group_name);
CREATE INDEX idx_users_specialty   ON users (specialty);
CREATE INDEX idx_users_email       ON users (email);

-- ============================================================
-- MESSAGING
-- ============================================================

CREATE TABLE conversations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type        conversation_type   NOT NULL,
    name        VARCHAR(255),                       -- required for group chats
    created_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE TABLE conversation_members (
    user_id             UUID    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    conversation_id     UUID    NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    joined_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, conversation_id)
);

CREATE INDEX idx_conv_members_conversation ON conversation_members (conversation_id);
CREATE INDEX idx_conv_members_user         ON conversation_members (user_id);

CREATE TABLE messages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id     UUID        NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    sender_id           UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    content             TEXT        NOT NULL,
    is_read             BOOLEAN     NOT NULL DEFAULT FALSE,
    edited		        BOOLEAN	    NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender       ON messages (sender_id);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================

CREATE TABLE announcements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255)    NOT NULL,
    content         TEXT            NOT NULL,
    target_group    VARCHAR(100),                   -- NULL = all groups
    created_by      UUID            NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_announcements_created_by   ON announcements (created_by);
CREATE INDEX idx_announcements_target_group ON announcements (target_group);
CREATE INDEX idx_announcements_created_at   ON announcements (created_at DESC);

-- ============================================================
-- MEETINGS
-- ============================================================

CREATE TABLE meetings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255)    NOT NULL,
    description     TEXT,
    meet_link       TEXT            NOT NULL,        -- Google Meet URL
    start_time      TIMESTAMPTZ     NOT NULL,
    end_time        TIMESTAMPTZ     NOT NULL,
    created_by      UUID            NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    target_group    VARCHAR(100),                    -- NULL = all groups
    calendar_event_id TEXT,                          -- Google Calendar event ID (optional)
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT meetings_end_after_start CHECK (end_time > start_time)
);

CREATE INDEX idx_meetings_created_by    ON meetings (created_by);
CREATE INDEX idx_meetings_target_group  ON meetings (target_group);
CREATE INDEX idx_meetings_start_time    ON meetings (start_time);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TYPE notification_type AS ENUM ('message', 'announcement', 'meeting');

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID                NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type            notification_type   NOT NULL,
    reference_id    UUID                NOT NULL,   -- FK to message / announcement / meeting id
    is_read         BOOLEAN             NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user     ON notifications (user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_ref      ON notifications (reference_id);

-- ============================================================
-- Migration: Add Conversation Events & Message Attachments
-- ============================================================
 
-- Conversation Events Table
CREATE TYPE event_type AS ENUM ('member_joined', 'member_left');
 
CREATE TABLE conversation_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID        NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    event_type      event_type  NOT NULL,
    user_id         UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    triggered_by_id UUID        REFERENCES users (id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
 
CREATE INDEX idx_conv_events_conversation ON conversation_events (conversation_id, created_at DESC);
CREATE INDEX idx_conv_events_user ON conversation_events (user_id);
 
-- Message Attachments Table
CREATE TABLE message_attachments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id  UUID         NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
    file_name   VARCHAR(255) NOT NULL,
    file_path   TEXT         NOT NULL,
    file_size   BIGINT       NOT NULL,
    mime_type   VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
 
CREATE INDEX idx_attachments_message ON message_attachments (message_id);
 
-- ============================================================
-- END OF MIGRATION
-- ============================================================

-- ============================================================
-- END OF SCHEMA
-- ============================================================