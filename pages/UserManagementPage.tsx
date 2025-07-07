

import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import PageContainer from '@/components/PageContainer';
import ErrorMessage from '@/components/ErrorMessage';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { PlusIcon } from '@/constants';
import { userService } from '@/services/userService';
import { LoadingSpinner } from '@/components/icons/LoadingSpinner';

import UserTable from '@/components/user-management/UserTable';
import UserEditModal from '@/components/user-management/UserEditModal';
import DangerZone from '@/components/user-management/DangerZone';

const UserManagementPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    // Modal states
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
    
    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const filters = {
                searchTerm: searchTerm || undefined,
                status: statusFilter || undefined,
                role: roleFilter || undefined
            };
            const data = await userService.getUsers(filters);
            setUsers(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch users.');
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, statusFilter, roleFilter]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(debounce);
    }, [fetchUsers]);
    
    const handleOpenCreateModal = () => {
        setEditingUser(null); // Clear editing user for creation
        setIsUserModalOpen(true);
    };
    
    const handleOpenEditModal = (user: User) => {
        setEditingUser(user);
        setIsUserModalOpen(true);
    };

    const handleModalClose = () => {
        setIsUserModalOpen(false);
        setEditingUser(null);
    };

    const handleModalSave = async () => {
        await fetchUsers();
        handleModalClose();
    };

    // Page Access Control
    if (currentUser?.role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <PageContainer title="User Management & System Settings" actions={
            <button onClick={handleOpenCreateModal} className="flex items-center bg-primary-500 hover:bg-primary-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md">
                <PlusIcon className="h-5 w-5 mr-2" /> Add User
            </button>
        }>
            <ErrorMessage message={error} />
            {successMessage && (
                <div className="my-4 p-3 bg-green-100 text-green-700 border border-green-300 rounded-md dark:bg-green-900/30 dark:text-green-300 dark:border-green-700">
                    {successMessage}
                </div>
            )}
            
            {isLoading && users.length === 0 ? <div className="flex justify-center p-8"><LoadingSpinner className="w-8 h-8"/></div> : 
             <UserTable
                users={users}
                currentUser={currentUser}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                roleFilter={roleFilter}
                setRoleFilter={setRoleFilter}
                onEditUser={handleOpenEditModal}
                onDataChange={fetchUsers}
             />
            }

            <DangerZone 
                onResetSuccess={(message) => setSuccessMessage(message)}
                onResetError={(err) => setError(err)}
            />
            
            <UserEditModal
                isOpen={isUserModalOpen}
                onClose={handleModalClose}
                onSave={handleModalSave}
                user={editingUser}
            />

        </PageContainer>
    );
};

export default UserManagementPage;