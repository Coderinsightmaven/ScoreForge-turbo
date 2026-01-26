/**
 * types.ts - Shared types for Tauri API modules.
 */

import type { ScoreboardComponent, SportType } from '../../types/scoreboard';

/**
 * The scoreboard data stored inside TauriScoreboardConfig.data
 * This is the serialized form of ScoreboardConfig (without top-level id/name
 * since those are stored at the TauriScoreboardConfig level).
 */
export interface ScoreboardData {
  id?: string;
  name?: string;
  dimensions: {
    width: number;
    height: number;
  };
  background: {
    color: string;
    image?: string;
    opacity: number;
  };
  components: ScoreboardComponent[];
  gridSettings: {
    enabled: boolean;
    size: number;
    snapToGrid: boolean;
  };
  sport: SportType;
  version: string;
  createdAt?: string;
  updatedAt?: string;
  // Optional runtime properties for scoreboard window display
  tennisApiScoreboardId?: string;
  scoreForgeConfig?: {
    apiKey: string;
    convexUrl: string;
    matchId: string;
  };
}

/**
 * Scoreboard configuration as returned from Tauri backend.
 * The `data` field contains the actual scoreboard design.
 */
export interface TauriScoreboardConfig {
  id: string;
  name: string;
  filename: string;
  data: ScoreboardData;
  created_at: string;
  updated_at: string;
}

export interface ScoreboardInfo {
  id: string;
  name: string;
}

export interface MatchInfo {
  matchId: string;
  player1Name: string;
  player2Name: string;
  tournament: string;
  round: string;
  status: string;
}

export interface LiveDataConnectionData {
  id: string;
  name: string;
  provider: string;
  apiUrl: string;
  pollInterval: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  lastUpdated?: string;
  lastError?: string;
}

export interface LiveDataBinding {
  componentId: string;
  connectionId: string;
  dataPath: string;
  updateInterval?: number;
}

export interface LiveDataState {
  connections: LiveDataConnectionData[];
  componentBindings: LiveDataBinding[];
}
