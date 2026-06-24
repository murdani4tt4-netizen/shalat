import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppUser, UserRole } from './types';
import { ROLE_PERMISSIONS } from './types';

interface AppState {
  // Auth
  user: AppUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (perm: keyof typeof ROLE_PERMISSIONS[UserRole]) => boolean;

  // UI State
  selectedStudentId: string | null;
  setSelectedStudentId: (id: string | null) => void;
  currentPrayerId: string | null;
  setCurrentPrayerId: (id: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      login: async (username: string, password: string) => {
        try {
          const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          });
          const data = await res.json();
          if (data.success) {
            set({
              user: data.user,
              isAuthenticated: true,
            });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
      hasPermission: (perm) => {
        const user = get().user;
        if (!user) return false;
        return ROLE_PERMISSIONS[user.role]?.[perm] ?? false;
      },

      // UI State
      selectedStudentId: null,
      setSelectedStudentId: (id) => set({ selectedStudentId: id }),
      currentPrayerId: null,
      setCurrentPrayerId: (id) => set({ currentPrayerId: id }),
    }),
    {
      name: 'absensi-sholat-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
