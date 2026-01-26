/**
 * Tauri API - Modular interface for Tauri backend commands.
 *
 * Re-exports all domain-specific modules and maintains backward
 * compatibility via the TauriAPI class.
 */

// Re-export all functions
export * from './monitors';
export * from './windows';
export * from './storage';
export * from './gameState';
export * from './websocket';
export * from './liveData';
export * from './exportImport';
export * from './types';

// Import for class wrapper
import * as monitors from './monitors';
import * as windows from './windows';
import * as storage from './storage';
import * as gameState from './gameState';
import * as websocket from './websocket';
import * as liveData from './liveData';
import * as exportImport from './exportImport';

/**
 * TauriAPI - Backward-compatible class wrapper for all Tauri commands.
 *
 * All methods are static and delegate to the modular functions.
 * New code should import functions directly from the modules.
 */
export class TauriAPI {
  // === Monitor Management ===
  static getMonitors = monitors.getMonitors;

  // === Scoreboard Window Management ===
  static createScoreboardWindow = windows.createScoreboardWindow;
  static closeScoreboardWindow = windows.closeScoreboardWindow;
  static closeAllScoreboardWindows = windows.closeAllScoreboardWindows;
  static updateScoreboardWindowPosition = windows.updateScoreboardWindowPosition;
  static updateScoreboardWindowSize = windows.updateScoreboardWindowSize;
  static listScoreboardWindows = windows.listScoreboardWindows;
  static toggleScoreboardFullscreen = windows.toggleScoreboardFullscreen;
  static setScoreboardFullscreen = windows.setScoreboardFullscreen;
  static getCurrentWindow = windows.getCurrentWindow;

  // === Storage Operations ===
  static saveScoreboard = storage.saveScoreboard;
  static loadScoreboard = storage.loadScoreboard;
  static listScoreboards = storage.listScoreboards;
  static deleteScoreboard = storage.deleteScoreboard;
  static exportScoreboard = storage.exportScoreboard;
  static importScoreboard = storage.importScoreboard;

  // === Game State Management ===
  static updateGameState = gameState.updateGameState;
  static getGameState = gameState.getGameState;
  static updateScore = gameState.updateScore;
  static updateTime = gameState.updateTime;
  static updatePeriod = gameState.updatePeriod;
  static toggleGameActive = gameState.toggleGameActive;
  static resetGame = gameState.resetGame;
  static updateTeamInfo = gameState.updateTeamInfo;

  // === WebSocket Operations ===
  static inspectLiveData = websocket.inspectLiveData;
  static checkWebSocketStatus = websocket.checkWebSocketStatus;
  static testWebSocketConnection = websocket.testWebSocketConnection;
  static connectWebSocket = websocket.connectWebSocket;
  static disconnectWebSocket = websocket.disconnectWebSocket;
  static sendWebSocketMessage = websocket.sendWebSocketMessage;
  static startWebSocketListener = websocket.startWebSocketListener;
  static stopWebSocketListener = websocket.stopWebSocketListener;

  // === Live Data Connection Storage ===
  static saveLiveDataConnections = liveData.saveLiveDataConnections;
  static loadLiveDataConnections = liveData.loadLiveDataConnections;
  static deleteLiveDataConnections = liveData.deleteLiveDataConnections;

  // === Export/Import Operations ===
  static exportScoreboardAsZip = exportImport.exportScoreboardAsZip;
  static importScoreboardFromZip = exportImport.importScoreboardFromZip;
}
