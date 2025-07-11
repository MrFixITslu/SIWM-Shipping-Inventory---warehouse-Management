-- Add department column to inventory_items if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventory_items' AND column_name = 'department'
    ) THEN
        ALTER TABLE inventory_items ADD COLUMN department VARCHAR(255);
        COMMENT ON COLUMN inventory_items.department IS 'Department or category for inventory item organization';
    END IF;
END $$; 