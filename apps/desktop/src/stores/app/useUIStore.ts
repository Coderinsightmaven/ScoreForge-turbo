/**
 * useUIStore - UI state slice for the application.
 *
 * Manages theme, sidebar, property panel, and toolbar states.
 * Can be used standalone or composed into useAppStore.
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

export interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  propertyPanelOpen: boolean;
  toolbarCompact: boolean;
}

export interface UIActions {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  togglePropertyPanel: () => void;
  toggleToolbarCompact: () => void;
  setSidebarOpen: (open: boolean) => void;
  setPropertyPanelOpen: (open: boolean) => void;
}

export type UIStore = UIState & UIActions;

export const createUISlice = (
  set: (fn: (state: UIState) => Partial<UIState>) => void
): UIStore => ({
  // Initial state
  theme: 'system',
  sidebarOpen: true,
  propertyPanelOpen: true,
  toolbarCompact: false,

  // Actions
  setTheme: (theme: Theme) => set(() => ({ theme })),

  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  togglePropertyPanel: () =>
    set((state) => ({ propertyPanelOpen: !state.propertyPanelOpen })),

  toggleToolbarCompact: () =>
    set((state) => ({ toolbarCompact: !state.toolbarCompact })),

  setSidebarOpen: (open: boolean) => set(() => ({ sidebarOpen: open })),

  setPropertyPanelOpen: (open: boolean) => set(() => ({ propertyPanelOpen: open })),
});

/**
 * Standalone UI store for components that only need UI state.
 */
export const useUIStore = create<UIStore>()(
  subscribeWithSelector((set) => createUISlice(set as any))
);
