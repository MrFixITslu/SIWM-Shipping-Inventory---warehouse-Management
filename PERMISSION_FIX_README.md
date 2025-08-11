# User Permission Fix for Warehouse Role

## Problem
When changing a user's group to 'warehouse' in user management, users were getting the error:
```
user group 'warehouse' is not authorised to access this route
```

## Root Cause
The system has both role-based authorization (for backend routes) and permission-based authorization (for frontend routes). When a user's role was changed, they weren't automatically assigned the necessary permissions for their new role.

## Solution
Implemented automatic permission assignment based on user roles:

### 1. Created Role-Permission Mapping
- **File**: `backend/config/rolePermissions.js`
- Maps each role to its default permissions
- Warehouse role gets access to: dashboard, incoming-shipments, inventory, orders, dispatch, warehouse-management, vendors, assets, reports, notifications, help

### 2. Updated User Service
- **File**: `backend/services/userService.js`
- Modified `createUser()` to assign default permissions when creating users
- Modified `updateUser()` to assign default permissions when role changes
- Modified `updateUserGroup()` to assign default permissions when role changes

### 3. Database Migration
- **File**: `backend/migrations/update_user_permissions.sql`
- Updates existing users with default permissions based on their current roles
- **Script**: `backend/run-permission-migration.js` to run the migration

## How to Apply the Fix

### For New Deployments
The fix is automatically applied when:
1. Creating new users (default permissions assigned)
2. Changing user roles (default permissions assigned)

### For Existing Deployments
Run the migration script to update existing users:

```bash
cd backend
node run-permission-migration.js
```

## Role Permissions Summary

| Role | Permissions |
|------|-------------|
| admin | All permissions |
| manager | All except user-management |
| Warehouse | dashboard, incoming-shipments, inventory, orders, dispatch, warehouse-management, vendors, assets, reports, notifications, help |
| Finance | dashboard, inventory, orders, vendors, reports, notifications, compliance, help |
| Broker | dashboard, incoming-shipments, inventory, orders, dispatch, vendors, reports, notifications, help |
| Requester | dashboard, inventory, orders, notifications, help |
| Technician | dashboard, inventory, orders, assets, notifications, help |
| Contractor | dashboard, inventory, orders, assets, notifications, help |

## Testing
1. Change a user's role to 'warehouse' in user management
2. The user should now have access to warehouse-related pages
3. No more "not authorized" errors should occur

## Files Modified
- `backend/config/rolePermissions.js` (new)
- `backend/services/userService.js`
- `backend/migrations/update_user_permissions.sql` (new)
- `backend/run-permission-migration.js` (new) 