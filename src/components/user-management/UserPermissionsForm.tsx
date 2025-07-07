
import React from 'react';
import { ALL_PERMISSIONS } from '@/constants/permissions';

interface UserPermissionsFormProps {
  selectedPermissions: string[];
  onPermissionChange: (permissionId: string, checked: boolean) => void;
}

const UserPermissionsForm: React.FC<UserPermissionsFormProps> = ({ selectedPermissions, onPermissionChange }) => {
  return (
    <div>
      <h4 className="text-md font-medium text-secondary-800 dark:text-secondary-200 mb-2">
        Page Permissions
      </h4>
      <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-3">
        Select which pages this user can access. Admins have access to all pages by default.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4">
        {ALL_PERMISSIONS.map((permission) => (
          <label key={permission.id} className="flex items-center">
            <input
              type="checkbox"
              checked={selectedPermissions.includes(permission.id)}
              onChange={(e) => onPermissionChange(permission.id, e.target.checked)}
              className="h-4 w-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">
              {permission.name}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default UserPermissionsForm;
