/**
 * websocket.ts - WebSocket operation Tauri commands.
 */
import { invoke } from '@tauri-apps/api/core';

/**
 * Inspects live data state (for debugging).
 */
export async function inspectLiveData(): Promise<string> {
  return await invoke('inspect_live_data');
}

/**
 * Checks the status of WebSocket connections.
 */
export async function checkWebSocketStatus(): Promise<string> {
  return await invoke('check_websocket_status');
}

/**
 * Tests a WebSocket connection without creating a persistent connection.
 */
export async function testWebSocketConnection(wsUrl: string): Promise<string> {
  return await invoke('test_websocket_connection', { wsUrl });
}

/**
 * Connects to a WebSocket for live tennis data.
 */
export async function connectWebSocket(
  wsUrl: string,
  connectionId: string
): Promise<string> {
  return await invoke('connect_websocket', { wsUrl, connectionId });
}

/**
 * Disconnects from a WebSocket connection.
 */
export async function disconnectWebSocket(connectionId: string): Promise<string> {
  return await invoke('disconnect_websocket', { connectionId });
}

/**
 * Sends a message through a WebSocket connection.
 */
export async function sendWebSocketMessage(connectionId: string, message: string): Promise<string> {
  return await invoke('send_websocket_message', { connectionId, message });
}

/**
 * Starts listening for messages on a WebSocket connection.
 */
export async function startWebSocketListener(connectionId: string): Promise<string> {
  return await invoke('start_websocket_listener', { connectionId });
}

/**
 * Stops listening for messages on a WebSocket connection.
 */
export async function stopWebSocketListener(connectionId: string): Promise<string> {
  return await invoke('stop_websocket_listener', { connectionId });
}
