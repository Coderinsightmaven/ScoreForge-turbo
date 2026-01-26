/**
 * exportImport.ts - ZIP export/import Tauri commands.
 */
import { invoke } from '@tauri-apps/api/core';
import { TauriScoreboardConfig } from './types';

/**
 * Result from ZIP export including any warnings about missing assets.
 */
export interface ExportResult {
  data: number[];
  warnings?: string[];
}

/**
 * Exports a scoreboard as a ZIP file containing design and all assets.
 * Returns the ZIP data as a byte array.
 */
export async function exportScoreboardAsZip(filename: string): Promise<number[]> {
  try {
    return await invoke('export_scoreboard_as_zip', { filename });
  } catch (error) {
    console.error('Failed to export scoreboard as zip:', error);
    throw error;
  }
}

/**
 * Imports a scoreboard from ZIP file data.
 * Returns the imported scoreboard configuration with remapped asset IDs.
 */
export async function importScoreboardFromZip(zipData: number[]): Promise<TauriScoreboardConfig> {
  try {
    return await invoke('import_scoreboard_from_zip', { zipData });
  } catch (error) {
    console.error('Failed to import scoreboard from zip:', error);
    throw error;
  }
}
