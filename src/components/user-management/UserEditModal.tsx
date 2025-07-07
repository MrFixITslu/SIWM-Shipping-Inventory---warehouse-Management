import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import ErrorMessage from '@/components/ErrorMessage';
import { User } from '@/types';
import { userService } from '@/services/userService';
import { USER_GROUPS } from '@/constants/permissions';
import LoadingSpinner from '@/components/icons/LoadingSpinner';
import UserPermissionsForm from './UserPermissionsForm';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  user: Partial<User> | null;
}

const TAILWIND_INPUT_CLASSES = "shadow-sm appearance-none border border-secondary-300 bg-white text-secondary-900 rounded-md px-3 py-2 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm";

const UserEditModal: React.FC<UserEditModalProps> = ({ isOpen, onClose, onSave, user }) => {
  const [formData, setFormData] = useState<Partial<User> & { password?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!user?.id;

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsSaving(false);
      if (user) {
        setFormData({ ...user, password: '' });
      } else {
        setFormData({ name: '', email: '', password: '', role: 'Requester', permissions: [] });
      }
    }
  }, [isOpen, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData(prev => {
      const currentPermissions = prev?.permissions || [];
      if (checked) {
        return { ...prev, permissions: [...currentPermissions, permissionId] };
      } else {
        return { ...prev, permissions: currentPermissions.filter(p => p !== permissionId) };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      if (isEditing) {
        await userService.updateUser(user!.id!, { role: formData.role, permissions: formData.permissions });
      } else {
        await userService.createUser({
          name: formData.name!,
          email: formData.email!,
          password: formData.password!,
          role: formData.role!,
          permissions: formData.permissions!
        });
      }
      onSave();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const userGroupsForSelect = USER_GROUPS.filter(g => g !== 'admin');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit User' : 'Add New User'} size="2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage message={error} />
        {!isEditing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="user-name" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Full Name</label>
                    <input 
                        id="user-name"
                        name="name" 
                        value={formData.name || ''} 
                        onChange={handleInputChange} 
                        required 
                        className={`mt-1 w-full ${TAILWIND_INPUT_CLASSES}`}
                        autoComplete="name"
                    />
                </div>
                <div>
                    <label htmlFor="user-email" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Email</label>
                    <input 
                        id="user-email"
                        type="email" 
                        name="email" 
                        value={formData.email || ''} 
                        onChange={handleInputChange} 
                        required 
                        className={`mt-1 w-full ${TAILWIND_INPUT_CLASSES}`}
                        autoComplete="email"
                    />
                </div>
            </div>
        )}
        {!isEditing && (
            <div>
                <label htmlFor="user-password" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Password</label>
                <input 
                    id="user-password"
                    type="password" 
                    name="password" 
                    value={formData.password || ''} 
                    onChange={handleInputChange} 
                    required 
                    minLength={6} 
                    className={`mt-1 w-full ${TAILWIND_INPUT_CLASSES}`} 
                    autoComplete="new-password"
                />
                <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">Minimum 6 characters.</p>
            </div>
        )}

        <div>
            <label htmlFor="user-role" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">User Group</label>
            <select 
                id="user-role"
                name="role" 
                value={formData.role || ''} 
                onChange={handleInputChange} 
                required 
                className={`mt-1 w-full ${TAILWIND_INPUT_CLASSES}`}
            >
                {user?.role === 'admin' && <option value="admin">Admin</option>}
                {userGroupsForSelect.map(group => (
                    <option key={group} value={group}>{group}</option>
                ))}
            </select>
        </div>

        <UserPermissionsForm selectedPermissions={formData.permissions || []} onPermissionChange={handlePermissionChange} />

        <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-600 rounded-md" disabled={isSaving}>Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50" disabled={isSaving}>
                {isSaving ? <LoadingSpinner className="w-5 h-5"/> : (isEditing ? 'Save Changes' : 'Create User')}
            </button>
        </div>
      </form>
    </Modal>
  );
};

export default UserEditModal;
