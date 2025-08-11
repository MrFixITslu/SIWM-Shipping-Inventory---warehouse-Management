-- Migration to add token_invalidated_at column to users table
-- This column is used to invalidate user tokens when their role changes

-- Add token_invalidated_at column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'token_invalidated_at') THEN
        ALTER TABLE users ADD COLUMN token_invalidated_at TIMESTAMP;
    END IF;
END $$;

-- Log the migration
INSERT INTO audit_logs (user_id, action, details, created_at)
VALUES (1, 'SYSTEM_MIGRATION', 'Added token_invalidated_at column to users table', CURRENT_TIMESTAMP); 