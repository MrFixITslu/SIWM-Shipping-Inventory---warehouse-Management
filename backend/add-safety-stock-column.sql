-- 1. Add the column if it does not exist
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS safety_stock INTEGER DEFAULT 0;

-- 2. Set a default value for existing rows (if you want a calculated default)
UPDATE inventory_items
SET safety_stock = GREATEST(reorder_point * 0.2, 10)
WHERE safety_stock IS NULL OR safety_stock = 0; 