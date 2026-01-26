/**
 * liveData.ts - Live data connection storage Tauri commands.
 */
import { invoke } from '@tauri-apps/api/core';
import { LiveDataState } from './types';

/**
 * Saves live data connection configurations to persistent storage.
 */
export async function saveLiveDataConnections(connectionsData: LiveDataState): Promise<void> {
  return await invoke('save_live_data_connections', { connectionsData });
}

/**
 * Loads live data connection configurations from persistent storage.
 */
export async function loadLiveDataConnections(): Promise<LiveDataState> {
  return await invoke('load_live_data_connections');
}

/**
 * Deletes all saved live data connection configurations.
 */
export async function deleteLiveDataConnections(): Promise<void> {
  return await invoke('delete_live_data_connections');
}
