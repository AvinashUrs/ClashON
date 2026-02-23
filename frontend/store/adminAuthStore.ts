import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Admin {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: string;
}

interface AdminAuthState {
  admin: Admin | null;
  isAdminAuthenticated: boolean;
  adminLogin: (admin: Admin) => void;
  adminLogout: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      admin: null,
      isAdminAuthenticated: false,
      adminLogin: (admin: Admin) => set({ admin, isAdminAuthenticated: true }),
      adminLogout: () => set({ admin: null, isAdminAuthenticated: false }),
    }),
    {
      name: 'admin-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
