/**
 * windows.ts - Scoreboard window management Tauri commands.
 */
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

/**
 * Creates a new scoreboard display window on the specified monitor.
 */
export async function createScoreboardWindow(
  windowId: string,
  monitorId: number,
  width: number,
  height: number,
  x: number,
  y: number,
  offsetX: number = 0,
  offsetY: number = 0,
  scoreboardData?: any
): Promise<void> {
  try {
    await invoke('create_scoreboard_window', {
      windowId,
      monitorId,
      width,
      height,
      x,
      y,
      offsetX,
      offsetY,
      scoreboardData,
    });
  } catch (error) {
    console.error('Failed to create scoreboard window:', error);
    throw error;
  }
}

/**
 * Closes a scoreboard display window.
 */
export async function closeScoreboardWindow(windowId: string): Promise<void> {
  try {
    await invoke('close_scoreboard_window', { windowId });
  } catch (error) {
    console.error('Failed to close scoreboard window:', error);
    throw error;
  }
}

/**
 * Closes all scoreboard display windows.
 */
export async function closeAllScoreboardWindows(): Promise<void> {
  try {
    await invoke('close_all_scoreboard_windows');
  } catch (error) {
    console.error('Failed to close all scoreboard windows:', error);
    throw error;
  }
}

/**
 * Updates the position of a scoreboard window.
 */
export async function updateScoreboardWindowPosition(
  windowId: string,
  x: number,
  y: number,
  offsetX: number = 0,
  offsetY: number = 0
): Promise<void> {
  try {
    await invoke('update_scoreboard_window_position', {
      windowId,
      x,
      y,
      offsetX,
      offsetY,
    });
  } catch (error) {
    console.error('Failed to update scoreboard window position:', error);
    throw error;
  }
}

/**
 * Updates the size of a scoreboard window.
 */
export async function updateScoreboardWindowSize(
  windowId: string,
  width: number,
  height: number
): Promise<void> {
  try {
    await invoke('update_scoreboard_window_size', { windowId, width, height });
  } catch (error) {
    console.error('Failed to update scoreboard window size:', error);
    throw error;
  }
}

/**
 * Lists all open scoreboard window IDs.
 */
export async function listScoreboardWindows(): Promise<string[]> {
  try {
    return await invoke('list_scoreboard_windows');
  } catch (error) {
    console.error('Failed to list scoreboard windows:', error);
    return [];
  }
}

/**
 * Toggles fullscreen mode for a scoreboard window.
 */
export async function toggleScoreboardFullscreen(windowId: string): Promise<void> {
  try {
    await invoke('toggle_scoreboard_fullscreen', { windowId });
  } catch (error) {
    console.error('Failed to toggle scoreboard fullscreen:', error);
    throw error;
  }
}

/**
 * Sets fullscreen mode for a scoreboard window.
 */
export async function setScoreboardFullscreen(windowId: string, fullscreen: boolean): Promise<void> {
  try {
    await invoke('set_scoreboard_fullscreen', { windowId, fullscreen });
  } catch (error) {
    console.error('Failed to set scoreboard fullscreen:', error);
    throw error;
  }
}

/**
 * Gets the current webview window instance.
 */
export async function getCurrentWindow() {
  return getCurrentWebviewWindow();
}
