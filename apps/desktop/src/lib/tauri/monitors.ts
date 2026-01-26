/**
 * monitors.ts - Monitor management Tauri commands.
 */
import { invoke } from '@tauri-apps/api/core';
import { MonitorInfo } from '../../types/tauri';

/**
 * Gets list of available monitors from the system.
 */
export async function getMonitors(): Promise<MonitorInfo[]> {
  try {
    return await invoke('get_available_monitors');
  } catch (error) {
    console.error('Failed to get monitors:', error);
    return [];
  }
}
