// backend/config/roles.js

// Defines the complete list of all valid user roles in the system.
// This is used for validating roles in authorization middleware to prevent errors.
const ALL_ROLES = [
  'admin',
  'manager',
  'Warehouse',
  'Finance',
  'Broker',
  'Requester',
  'Technician',
  'Contractor',
];

// Defines the roles that can be assigned to a user through the UI/API.
// This is typically the same as ALL_ROLES but could be a subset if some roles
// are reserved for system/internal use only.
const USER_GROUPS = [
  'admin',
  'manager',
  'Warehouse',
  'Finance',
  'Broker',
  'Requester',
  'Technician',
  'Contractor',
];

module.exports = {
  ALL_ROLES,
  USER_GROUPS,
};
