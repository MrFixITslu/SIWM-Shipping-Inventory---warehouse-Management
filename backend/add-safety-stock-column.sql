-- Add safety_stock column to inventory_items if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventory_items' AND column_name = 'safety_stock') THEN
        ALTER TABLE inventory_items ADD COLUMN safety_stock INTEGER DEFAULT 0;
    END IF;
END $$;

-- Update existing inventory items to have default safety stock if they don't have any
UPDATE inventory_items 
SET safety_stock = GREATEST(reorder_point * 0.2, 10) 
WHERE safety_stock IS NULL OR safety_stock = 0; 