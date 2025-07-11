-- Add is_aged column to inventory_items if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventory_items' AND column_name = 'is_aged') THEN
        ALTER TABLE inventory_items ADD COLUMN is_aged BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add comment to explain the column purpose
COMMENT ON COLUMN inventory_items.is_aged IS 'Indicates if this item was in the warehouse before the app was available'; 