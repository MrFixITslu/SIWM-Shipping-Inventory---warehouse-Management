-- Multi-Warehouse Support Schema
-- This file adds support for multiple warehouses, customer support, and enhanced offline capabilities

-- Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL, -- e.g., 'WH001', 'WH002'
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'USA',
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(100),
    manager_id INTEGER REFERENCES users(id),
    capacity_sqft INTEGER,
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, maintenance
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create warehouse zones for better organization
CREATE TABLE IF NOT EXISTS warehouse_zones (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL, -- e.g., 'A', 'B', 'C'
    description TEXT,
    temperature_zone VARCHAR(20) DEFAULT 'ambient', -- ambient, cold, frozen
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create warehouse aisles for detailed location tracking
CREATE TABLE IF NOT EXISTS warehouse_aisles (
    id SERIAL PRIMARY KEY,
    zone_id INTEGER REFERENCES warehouse_zones(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL, -- e.g., 'A1', 'A2', 'B1'
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create warehouse shelves for precise location tracking
CREATE TABLE IF NOT EXISTS warehouse_shelves (
    id SERIAL PRIMARY KEY,
    aisle_id INTEGER REFERENCES warehouse_aisles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL, -- e.g., 'A1-S1', 'A1-S2'
    level INTEGER DEFAULT 1, -- shelf level (1, 2, 3, etc.)
    capacity_cubic_ft DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add warehouse_id to inventory_items table
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE;

-- Add warehouse_id to warehouse_orders table
ALTER TABLE warehouse_orders 
ADD COLUMN IF NOT EXISTS warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE;

-- Add warehouse_id to asns table
ALTER TABLE asns 
ADD COLUMN IF NOT EXISTS warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE;

-- Add warehouse_id to outbound_shipments table
ALTER TABLE outbound_shipments 
ADD COLUMN IF NOT EXISTS warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE;

-- Add warehouse_id to vendors table for preferred warehouse assignments
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS preferred_warehouse_id INTEGER REFERENCES warehouses(id);

-- Create customer support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(20) UNIQUE NOT NULL, -- e.g., 'TKT-2024-001'
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- technical, billing, inventory, shipping, general
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    status VARCHAR(20) DEFAULT 'open', -- open, in_progress, resolved, closed
    assigned_to INTEGER REFERENCES users(id),
    created_by INTEGER REFERENCES users(id) NOT NULL,
    warehouse_id INTEGER REFERENCES warehouses(id),
    related_order_id INTEGER REFERENCES warehouse_orders(id),
    related_shipment_id INTEGER REFERENCES outbound_shipments(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolution_notes TEXT
);

-- Create support ticket responses table
CREATE TABLE IF NOT EXISTS support_ticket_responses (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false, -- internal notes vs customer-visible responses
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create offline action queue table for offline capabilities
CREATE TABLE IF NOT EXISTS offline_actions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL, -- create, update, delete
    entity_type VARCHAR(50) NOT NULL, -- inventory, order, shipment, etc.
    entity_id INTEGER, -- ID of the entity being modified
    action_data JSONB NOT NULL, -- The actual data for the action
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    retry_count INTEGER DEFAULT 0
);

-- Create inventory movement tracking table for visual flow
CREATE TABLE IF NOT EXISTS inventory_movements (
    id SERIAL PRIMARY KEY,
    inventory_item_id INTEGER REFERENCES inventory_items(id) ON DELETE CASCADE,
    warehouse_id INTEGER REFERENCES warehouses(id),
    movement_type VARCHAR(50) NOT NULL, -- received, shipped, transferred, adjusted, counted
    quantity INTEGER NOT NULL,
    from_location VARCHAR(100), -- e.g., 'A1-S1', 'Loading Dock'
    to_location VARCHAR(100), -- e.g., 'A1-S1', 'Shipping Dock'
    reference_type VARCHAR(50), -- order, shipment, asn, manual
    reference_id INTEGER, -- ID of the related entity
    performed_by INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create warehouse capacity tracking table
CREATE TABLE IF NOT EXISTS warehouse_capacity (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_capacity_cubic_ft DECIMAL(10,2),
    used_capacity_cubic_ft DECIMAL(10,2),
    available_capacity_cubic_ft DECIMAL(10,2),
    capacity_percentage DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create warehouse performance metrics table
CREATE TABLE IF NOT EXISTS warehouse_performance (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    orders_processed INTEGER DEFAULT 0,
    shipments_processed INTEGER DEFAULT 0,
    items_received INTEGER DEFAULT 0,
    items_shipped INTEGER DEFAULT 0,
    average_order_fulfillment_time_hours DECIMAL(5,2),
    average_shipment_processing_time_hours DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_warehouse_id ON inventory_items(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_orders_warehouse_id ON warehouse_orders(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_asns_warehouse_id ON asns(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_outbound_shipments_warehouse_id ON outbound_shipments(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_warehouse_id ON support_tickets(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_offline_actions_status ON offline_actions(status);
CREATE INDEX IF NOT EXISTS idx_offline_actions_user_id ON offline_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_warehouse_id ON inventory_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at);

-- Insert default warehouse if none exists
INSERT INTO warehouses (name, code, address, city, state, country, postal_code, phone, email)
VALUES ('Main Distribution Center', 'WH001', '123 Industrial Blvd', 'Springfield', 'IL', 'USA', '62701', '555-123-4567', 'warehouse@company.com')
ON CONFLICT (code) DO NOTHING;

-- Insert default zones for the main warehouse
INSERT INTO warehouse_zones (warehouse_id, name, code, description, temperature_zone)
SELECT 
    w.id,
    'Zone A - General Storage',
    'A',
    'General storage area for ambient temperature items',
    'ambient'
FROM warehouses w WHERE w.code = 'WH001'
ON CONFLICT DO NOTHING;

INSERT INTO warehouse_zones (warehouse_id, name, code, description, temperature_zone)
SELECT 
    w.id,
    'Zone B - Cold Storage',
    'B',
    'Cold storage area for temperature-sensitive items',
    'cold'
FROM warehouses w WHERE w.code = 'WH001'
ON CONFLICT DO NOTHING;

-- Insert default aisles
INSERT INTO warehouse_aisles (zone_id, name, code, description)
SELECT 
    z.id,
    'Aisle A1',
    'A1',
    'Main aisle in Zone A'
FROM warehouse_zones z WHERE z.code = 'A'
ON CONFLICT DO NOTHING;

INSERT INTO warehouse_aisles (zone_id, name, code, description)
SELECT 
    z.id,
    'Aisle A2',
    'A2',
    'Secondary aisle in Zone A'
FROM warehouse_zones z WHERE z.code = 'A'
ON CONFLICT DO NOTHING;

-- Insert default shelves
INSERT INTO warehouse_shelves (aisle_id, name, code, level, capacity_cubic_ft)
SELECT 
    a.id,
    'Shelf A1-S1',
    'A1-S1',
    1,
    100.00
FROM warehouse_aisles a WHERE a.code = 'A1'
ON CONFLICT DO NOTHING;

INSERT INTO warehouse_shelves (aisle_id, name, code, level, capacity_cubic_ft)
SELECT 
    a.id,
    'Shelf A1-S2',
    'A1-S2',
    2,
    100.00
FROM warehouse_aisles a WHERE a.code = 'A1'
ON CONFLICT DO NOTHING;

-- Update existing inventory items to be assigned to the default warehouse
UPDATE inventory_items 
SET warehouse_id = (SELECT id FROM warehouses WHERE code = 'WH001')
WHERE warehouse_id IS NULL;

-- Update existing orders to be assigned to the default warehouse
UPDATE warehouse_orders 
SET warehouse_id = (SELECT id FROM warehouses WHERE code = 'WH001')
WHERE warehouse_id IS NULL;

-- Update existing ASNs to be assigned to the default warehouse
UPDATE asns 
SET warehouse_id = (SELECT id FROM warehouses WHERE code = 'WH001')
WHERE warehouse_id IS NULL;

-- Update existing outbound shipments to be assigned to the default warehouse
UPDATE outbound_shipments 
SET warehouse_id = (SELECT id FROM warehouses WHERE code = 'WH001')
WHERE warehouse_id IS NULL; 