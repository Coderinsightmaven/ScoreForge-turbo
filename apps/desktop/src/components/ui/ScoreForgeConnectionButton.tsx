import React, { useState } from 'react';
import { useLiveDataStore } from '../../stores/useLiveDataStore';
import { ScoreForgeConnectionDialog } from './ScoreForgeConnectionDialog';

/**
 * ScoreForge connection button that shows connection status and opens the connection dialog.
 */
export const ScoreForgeConnectionButton: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false);
  const { connections } = useLiveDataStore();

  // Check if there's an active ScoreForge connection
  const activeConnection = connections.find(
    (c) => c.provider === 'scoreforge' && c.isActive
  );

  const isConnected = !!activeConnection;

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
          isConnected
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
        title={isConnected ? 'ScoreForge Connected' : 'Connect to ScoreForge'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <span>{isConnected ? 'ScoreForge Connected' : 'ScoreForge'}</span>
      </button>

      <ScoreForgeConnectionDialog isOpen={showDialog} onClose={() => setShowDialog(false)} />
    </>
  );
};
