-- Add is_archived column to alert_log table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'alert_log' AND column_name = 'is_archived'
    ) THEN
        ALTER TABLE alert_log ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN alert_log.is_archived IS 'Indicates if the notification has been archived (older than 120 hours)';
    END IF;
END $$;

-- Add created_at column if it doesn't exist (for the archiving logic)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'alert_log' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE alert_log ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        COMMENT ON COLUMN alert_log.created_at IS 'Timestamp when the notification was created';
    END IF;
END $$;

-- Create index on created_at for better performance on archiving queries
CREATE INDEX IF NOT EXISTS idx_alert_log_created_at ON alert_log(created_at);
CREATE INDEX IF NOT EXISTS idx_alert_log_is_archived ON alert_log(is_archived);
CREATE INDEX IF NOT EXISTS idx_alert_log_type ON alert_log(type); 