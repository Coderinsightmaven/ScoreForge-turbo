/**
 * useMonitorStore - Monitor management slice.
 *
 * Manages monitor detection and selection.
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { MonitorInfo } from '../../types/tauri';
import { TauriAPI } from '../../lib/tauri';

export interface MonitorState {
  monitors: MonitorInfo[];
  selectedMonitor: MonitorInfo | null;
  isLoadingMonitors: boolean;
}

export interface MonitorActions {
  loadMonitors: () => Promise<void>;
  selectMonitor: (monitor: MonitorInfo | null) => void;
}

export type MonitorStore = MonitorState & MonitorActions;

export const createMonitorSlice = (
  set: (fn: (state: MonitorState) => Partial<MonitorState>) => void
): MonitorStore => ({
  // Initial state
  monitors: [],
  selectedMonitor: null,
  isLoadingMonitors: false,

  // Actions
  loadMonitors: async () => {
    set(() => ({ isLoadingMonitors: true }));

    try {
      const monitors = await TauriAPI.getMonitors();
      set(() => ({
        monitors,
        isLoadingMonitors: false,
        selectedMonitor: monitors.length > 0 ? monitors[0] : null,
      }));
    } catch (error) {
      console.error('Failed to load monitors:', error);
      set(() => ({ isLoadingMonitors: false }));
    }
  },

  selectMonitor: (monitor: MonitorInfo | null) => set(() => ({ selectedMonitor: monitor })),
});

/**
 * Standalone monitor store for components that only need monitor state.
 */
export const useMonitorStore = create<MonitorStore>()(
  subscribeWithSelector((set) => createMonitorSlice(set as any))
);
