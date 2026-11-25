// store/auth.store.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ModuleNode = {
  id: string;
  code: string;
  name: string;
  route: string;
  index: number;
  parentId: string | null;
  children?: ModuleNode[];
};

export type SessionCompany = {
  id: string;
  name: string;
  nit?: string | null;
};

export type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  modules: ModuleNode[];
  company: SessionCompany | null;

  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  setTokens: (accessToken: string, refreshToken: string) => void;
  setModules: (modules: ModuleNode[]) => void;
  setCompany: (company: SessionCompany | null) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      modules: [],
      company: null,

      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setModules: (modules) => set({ modules }),
      setCompany: (company) => set({ company }),
      clear: () => set({ accessToken: null, refreshToken: null, modules: [], company: null }),
    }),
    {
      name: "sgc_auth", 
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
    },
    }
  )
);
