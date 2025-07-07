import { User, UserRole, AuditLogEntry } from '@/types';
import { api } from './apiHelper';

type UserCreationData = Omit<User, 'id' | 'token' | 'createdAt' | 'permissions'>;
type UserFilters = {
    status?: string;
    role?: string;
    searchTerm?: string;
}

export const userService = {
  getUsers: async (filters: UserFilters = {}): Promise<User[]> => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.role) params.append('role', filters.role);
    if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
    const queryString = params.toString();

    const users: User[] = await api.get(`/users?${queryString}`);
    return users.map(u => ({...u, permissions: u.permissions || [] }));
  },

  createUser: (userData: UserCreationData & { password?: string, permissions?: string[], role: UserRole }): Promise<User> => {
    return api.post('/users', userData);
  },

  updateUser: (userId: number, data: { role?: UserRole, permissions?: string[] }): Promise<User> => {
    return api.put(`/users/${userId}`, data);
  },
  
  updateUserStatus: (userId: number, status: 'active' | 'inactive'): Promise<User> => {
    return api.put(`/users/${userId}/status`, { status });
  },
  
  updateUserGroup: (userId: number, role: User['role']): Promise<User> => {
    return api.put(`/users/${userId}/group`, { role });
  },
  
  resetPassword: (userId: number, newPassword: string): Promise<{message: string}> => {
    return api.put(`/users/${userId}/reset-password`, { newPassword });
  },

  deleteUser: (userId: number): Promise<void> => {
    return api.delete(`/users/${userId}`);
  },

  getUserAuditLog: (userId: number): Promise<AuditLogEntry[]> => {
    return api.get(`/users/audit-log/${userId}`);
  },
};
