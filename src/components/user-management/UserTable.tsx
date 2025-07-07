
import React, { useState } from 'react';
import Table from '@/components/Table';
import ConfirmationModal from '@/components/ConfirmationModal';
import UserAuditLogModal from './UserAuditLogModal';
import { User, ColumnDefinition, UserRole } from '@/types';
import { userService } from '@/services/userService';
import { USER_GROUPS } from '@/constants/permissions';
import { EditIcon, CheckBadgeIcon, XCircleIcon, ClockIcon } from '@/constants';
import useConfirmationModal from '@/hooks/useConfirmationModal';

interface UserTableProps {
  users: User[];
  currentUser: User;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  roleFilter: string;
  setRoleFilter: (role: string) => void;
  onEditUser: (user: User) => void;
  onDataChange: () => void;
}

const UserTable: React.FC<UserTableProps> = ({ users, currentUser, searchTerm, setSearchTerm, statusFilter, setStatusFilter, roleFilter, setRoleFilter, onEditUser, onDataChange }) => {
  
  const { isModalOpen, confirmButtonText, showConfirmation, handleConfirm, handleClose } = useConfirmationModal();
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedUserForLogs, setSelectedUserForLogs] = useState<User | null>(null);

  const handleStatusToggle = (user: User) => {
    showConfirmation(async () => {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await userService.updateUserStatus(user.id, newStatus);
      onDataChange();
    }, { confirmText: `Confirm ${user.status === 'active' ? 'Deactivation' : 'Activation'}` });
  };
  
  const handleViewAuditLog = (user: User) => {
    setSelectedUserForLogs(user);
    setIsAuditModalOpen(true);
  };

  const getStatusBadge = (status?: 'active' | 'inactive') => {
    const is_active = status === 'active';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${is_active ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'}`}>
        {is_active ? <CheckBadgeIcon className="h-4 w-4 mr-1"/> : <XCircleIcon className="h-4 w-4 mr-1"/>}
        {status}
      </span>
    );
  };
  
  const columns: ColumnDefinition<User, keyof User>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'role', header: 'Group', sortable: true },
    { key: 'status', header: 'Status', render: item => getStatusBadge(item.status), sortable: true },
  ];
  
  const actions = (item: User) => (
    <div className="flex space-x-2">
      <button onClick={() => onEditUser(item)} className="p-1 text-blue-500 hover:text-blue-700" title="Edit Permissions & Group"><EditIcon className="h-5 w-5" /></button>
      <button onClick={() => handleViewAuditLog(item)} className="p-1 text-secondary-500 hover:text-secondary-700" title="View Audit Log"><ClockIcon className="h-5 w-5" /></button>
      {currentUser.id !== item.id && (
        <button onClick={() => handleStatusToggle(item)} className="p-1" title={item.status === 'active' ? 'Deactivate User' : 'Activate User'}>
          {item.status === 'active' ? <XCircleIcon className="h-5 w-5 text-red-500 hover:text-red-700" /> : <CheckBadgeIcon className="h-5 w-5 text-green-500 hover:text-green-700" />}
        </button>
      )}
    </div>
  );

  return (
    <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
                <label htmlFor="user-search" className="sr-only">Search users</label>
                <input 
                    id="user-search"
                    type="text" 
                    placeholder="Search by name or email..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="w-full md:col-span-1 shadow-sm border-secondary-300 rounded-md dark:bg-secondary-700 dark:border-secondary-600"
                    autoComplete="off"
                />
            </div>
            <div>
                <label htmlFor="status-filter" className="sr-only">Filter by status</label>
                <select 
                    id="status-filter"
                    value={statusFilter} 
                    onChange={e => setStatusFilter(e.target.value)} 
                    className="w-full md:col-span-1 shadow-sm border-secondary-300 rounded-md dark:bg-secondary-700 dark:border-secondary-600"
                >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>
            <div>
                <label htmlFor="role-filter" className="sr-only">Filter by role</label>
                <select 
                    id="role-filter"
                    value={roleFilter} 
                    onChange={e => setRoleFilter(e.target.value)} 
                    className="w-full md:col-span-1 shadow-sm border-secondary-300 rounded-md dark:bg-secondary-700 dark:border-secondary-600"
                >
                    <option value="">All Groups</option>
                    {USER_GROUPS.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
            </div>
        </div>
        <Table<User> columns={columns} data={users} actions={actions} />
        
        <ConfirmationModal
            isOpen={isModalOpen}
            onClose={handleClose}
            onConfirm={handleConfirm}
            title="Confirm Status Change"
            message="Are you sure you want to change this user's status?"
            confirmButtonText={confirmButtonText}
        />
        <UserAuditLogModal
            isOpen={isAuditModalOpen}
            onClose={() => setIsAuditModalOpen(false)}
            user={selectedUserForLogs}
        />
    </>
  );
};

export default UserTable;
