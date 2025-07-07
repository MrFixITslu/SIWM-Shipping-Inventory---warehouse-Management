
import { api } from './apiHelper';
import { User, UserRole } from '@/types';

const USER_INFO_KEY = 'userInfo';

// Type for successful authentication response from backend
interface AuthSuccessResponse extends Omit<User, 'id'> {
  _id: number; // Backend often uses _id
  token: string;
}

const handleAuthSuccess = (data: AuthSuccessResponse): User => {
    if (!data || !data.token || !data._id) {
        throw new Error('Authentication response was successful but did not include a token or valid user data.');
    }
    const userToStore: User = {
        id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        permissions: data.permissions || [],
        token: data.token,
    };
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userToStore));
    return userToStore;
};

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    const data = await api.post<AuthSuccessResponse>('/auth/login', { email, password });
    return handleAuthSuccess(data);
  },

  register: async (name: string, email: string, password: string, role?: UserRole): Promise<User> => {
    const data = await api.post<AuthSuccessResponse>('/auth/register', { name, email, password, role: role || 'Requester' });
    return handleAuthSuccess(data);
  },

  logout: (): void => {
    localStorage.removeItem(USER_INFO_KEY);
  },

  getCurrentUser: (): User | null => {
    const storedUserInfo = localStorage.getItem(USER_INFO_KEY);
    if (storedUserInfo) {
      try {
        return JSON.parse(storedUserInfo) as User;
      } catch (e) {
        console.error("Error parsing stored user info:", e);
        localStorage.removeItem(USER_INFO_KEY); // Clear corrupted data
        return null;
      }
    }
    return null;
  },

  getUserProfile: async (): Promise<User> => {
    // The api helper automatically sends the token from localStorage
    const data = await api.get<Omit<User, 'token'> & { _id: number }>('/auth/profile');
    const currentUser = authService.getCurrentUser();
    
    if (data && currentUser?.token) {
        const updatedUser: User = {
            id: data._id,
            name: data.name,
            email: data.email,
            role: data.role,
            permissions: data.permissions || [],
            token: currentUser.token, // Keep existing valid token
        };
        // Also update localStorage with potentially fresh data (role, permissions)
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(updatedUser));
        return updatedUser;
    }
    
    // If we get here, something is wrong (e.g., no token on frontend but API call succeeded?)
    // This case should be rare, but we handle it by logging out.
    authService.logout();
    throw new Error('Could not validate session.');
  },
};
