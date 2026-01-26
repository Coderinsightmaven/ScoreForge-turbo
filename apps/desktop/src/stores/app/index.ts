/**
 * App store slices - Modular state management.
 *
 * These slices can be used standalone or composed into the main useAppStore.
 */
export { useUIStore, createUISlice } from './useUIStore';
export type { UIState, UIActions, UIStore, Theme } from './useUIStore';

export { useMonitorStore, createMonitorSlice } from './useMonitorStore';
export type { MonitorState, MonitorActions, MonitorStore } from './useMonitorStore';
