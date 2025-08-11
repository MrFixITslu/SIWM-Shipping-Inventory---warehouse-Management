// backend/config/rolePermissions.js

// Default permissions for each role
const ROLE_PERMISSIONS = {
  'admin': [
    'dashboard',
    'incoming-shipments',
    'inventory',
    'orders',
    'dispatch',
    'warehouse-management',
    'vendors',
    'assets',
    'master-data',
    'reports',
    'notifications',
    'compliance',
    'user-management',
    'help'
  ],
  'manager': [
    'dashboard',
    'incoming-shipments',
    'inventory',
    'orders',
    'dispatch',
    'warehouse-management',
    'vendors',
    'assets',
    'master-data',
    'reports',
    'notifications',
    'compliance',
    'help'
  ],
  'Warehouse': [
    'dashboard',
    'incoming-shipments',
    'inventory',
    'orders',
    'dispatch',
    'warehouse-management',
    'vendors',
    'assets',
    'reports',
    'notifications',
    'help'
  ],
  'Finance': [
    'dashboard',
    'inventory',
    'orders',
    'vendors',
    'reports',
    'notifications',
    'compliance',
    'help'
  ],
  'Broker': [
    'dashboard',
    'incoming-shipments',
    'inventory',
    'orders',
    'dispatch',
    'vendors',
    'reports',
    'notifications',
    'help'
  ],
  'Requester': [
    'dashboard',
    'inventory',
    'orders',
    'notifications',
    'help'
  ],
  'Technician': [
    'dashboard',
    'inventory',
    'orders',
    'assets',
    'notifications',
    'help'
  ],
  'Contractor': [
    'dashboard',
    'inventory',
    'orders',
    'assets',
    'notifications',
    'help'
  ]
};

module.exports = {
  ROLE_PERMISSIONS
}; 