-- Create system_settings table for storing application settings
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    weekly_installs INTEGER DEFAULT 66,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50) DEFAULT 'default',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default run rate setting
INSERT INTO system_settings (setting_key, weekly_installs, source) 
VALUES ('run_rate', 66, 'default')
ON CONFLICT (setting_key) DO NOTHING;

-- Add safety_stock column to inventory_items if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventory_items' AND column_name = 'safety_stock') THEN
        ALTER TABLE inventory_items ADD COLUMN safety_stock INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add primary_vendor_id column to inventory_items if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventory_items' AND column_name = 'primary_vendor_id') THEN
        ALTER TABLE inventory_items ADD COLUMN primary_vendor_id INTEGER;
        ALTER TABLE inventory_items ADD CONSTRAINT fk_inventory_primary_vendor 
            FOREIGN KEY (primary_vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add lead_time_days column to vendors if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vendors' AND column_name = 'lead_time_days') THEN
        ALTER TABLE vendors ADD COLUMN lead_time_days INTEGER DEFAULT 14;
    END IF;
END $$;

-- Update existing inventory items to have default safety stock if they don't have any
UPDATE inventory_items 
SET safety_stock = GREATEST(reorder_point * 0.2, 10) 
WHERE safety_stock IS NULL OR safety_stock = 0;

-- Add completed_at column to asns table for shipment completion tracking
ALTER TABLE asns
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP NULL; 