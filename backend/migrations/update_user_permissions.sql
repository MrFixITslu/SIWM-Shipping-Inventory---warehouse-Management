-- Migration to update existing users with default permissions based on their roles
-- This script should be run after the rolePermissions.js configuration is in place

-- Update admin users
UPDATE users 
SET permissions = ARRAY['dashboard', 'incoming-shipments', 'inventory', 'orders', 'dispatch', 'warehouse-management', 'vendors', 'assets', 'master-data', 'reports', 'notifications', 'compliance', 'user-management', 'help']
WHERE role = 'admin' AND (permissions IS NULL OR permissions = '{}');

-- Update manager users
UPDATE users 
SET permissions = ARRAY['dashboard', 'incoming-shipments', 'inventory', 'orders', 'dispatch', 'warehouse-management', 'vendors', 'assets', 'master-data', 'reports', 'notifications', 'compliance', 'help']
WHERE role = 'manager' AND (permissions IS NULL OR permissions = '{}');

-- Update warehouse users
UPDATE users 
SET permissions = ARRAY['dashboard', 'incoming-shipments', 'inventory', 'orders', 'dispatch', 'warehouse-management', 'vendors', 'assets', 'reports', 'notifications', 'help']
WHERE role = 'Warehouse' AND (permissions IS NULL OR permissions = '{}');

-- Update finance users
UPDATE users 
SET permissions = ARRAY['dashboard', 'inventory', 'orders', 'vendors', 'reports', 'notifications', 'compliance', 'help']
WHERE role = 'Finance' AND (permissions IS NULL OR permissions = '{}');

-- Update broker users
UPDATE users 
SET permissions = ARRAY['dashboard', 'incoming-shipments', 'inventory', 'orders', 'dispatch', 'vendors', 'reports', 'notifications', 'help']
WHERE role = 'Broker' AND (permissions IS NULL OR permissions = '{}');

-- Update requester users
UPDATE users 
SET permissions = ARRAY['dashboard', 'inventory', 'orders', 'notifications', 'help']
WHERE role = 'Requester' AND (permissions IS NULL OR permissions = '{}');

-- Update technician users
UPDATE users 
SET permissions = ARRAY['dashboard', 'inventory', 'orders', 'assets', 'notifications', 'help']
WHERE role = 'Technician' AND (permissions IS NULL OR permissions = '{}');

-- Update contractor users
UPDATE users 
SET permissions = ARRAY['dashboard', 'inventory', 'orders', 'assets', 'notifications', 'help']
WHERE role = 'Contractor' AND (permissions IS NULL OR permissions = '{}');

-- Log the migration
INSERT INTO audit_logs (user_id, action, details, created_at)
VALUES (1, 'SYSTEM_MIGRATION', 'Updated existing users with default permissions based on their roles', CURRENT_TIMESTAMP); 