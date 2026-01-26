import React, { useState, useEffect } from 'react';
import { useLiveDataStore } from '../../stores/useLiveDataStore';
import { scoreforgeApi } from '../../services/scoreforgeApi';
import type {
  ScoreForgeConfig,
  ScoreForgeTournamentListItem,
  ScoreForgeMatch,
} from '../../types/scoreforge';

interface ScoreForgeConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type ConnectionStep = 'config' | 'tournament' | 'match' | 'connected';

export const ScoreForgeConnectionDialog: React.FC<ScoreForgeConnectionDialogProps> = ({
  isOpen,
  onClose,
}) => {
  // Connection configuration
  const [apiKey, setApiKey] = useState('');
  const [convexUrl, setConvexUrl] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [pollInterval, setPollInterval] = useState(2);

  // Selection state
  const [tournaments, setTournaments] = useState<ScoreForgeTournamentListItem[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [matches, setMatches] = useState<ScoreForgeMatch[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [courtFilter, setCourtFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'live' | 'scheduled' | ''>('');

  // UI state
  const [step, setStep] = useState<ConnectionStep>('config');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);

  const { connectToScoreForge, stopScoreForgePolling, connections } = useLiveDataStore();

  // Find active ScoreForge connection
  const activeConnection = connections.find(
    (c) => c.provider === 'scoreforge' && c.isActive
  );

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (activeConnection) {
        setStep('connected');
        setConnectionId(activeConnection.id);
      } else {
        setStep('config');
      }
      setError(null);
    }
  }, [isOpen, activeConnection]);

  // Get unique courts from matches
  const availableCourts = [...new Set(matches.filter((m) => m.court).map((m) => m.court!))];

  // Filter matches based on filters
  const filteredMatches = matches.filter((m) => {
    if (courtFilter && m.court !== courtFilter) return false;
    if (statusFilter && m.status !== statusFilter) return false;
    return true;
  });

  const handleTestConnection = async () => {
    if (!apiKey.trim() || !convexUrl.trim()) {
      setError('Please enter both API key and Convex URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const config: ScoreForgeConfig = { apiKey: apiKey.trim(), convexUrl: convexUrl.trim() };
      const result = await scoreforgeApi.testConnection(config);

      if (!result.success) {
        setError(result.error || 'Connection test failed');
        return;
      }

      // Fetch tournaments
      const tournamentsResponse = await scoreforgeApi.listTournaments(config, 'active');

      if (tournamentsResponse.error) {
        setError(tournamentsResponse.error);
        return;
      }

      setTournaments(tournamentsResponse.tournaments || []);
      setStep('tournament');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTournament = async (tournamentId: string) => {
    setSelectedTournamentId(tournamentId);
    setLoading(true);
    setError(null);

    try {
      const config: ScoreForgeConfig = { apiKey, convexUrl };
      const matchesResponse = await scoreforgeApi.listMatches(config, tournamentId);

      if (matchesResponse.error) {
        setError(matchesResponse.error);
        return;
      }

      setMatches(matchesResponse.matches || []);
      setStep('match');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedMatchId) {
      setError('Please select a match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const config: ScoreForgeConfig = { apiKey, convexUrl };
      const newConnectionId = await connectToScoreForge(
        config,
        selectedTournamentId,
        selectedMatchId
      );
      setConnectionId(newConnectionId);
      setStep('connected');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    if (connectionId) {
      stopScoreForgePolling(connectionId);
    }
    setConnectionId(null);
    setStep('config');
    // Reset selections
    setSelectedTournamentId('');
    setSelectedMatchId('');
    setMatches([]);
    setTournaments([]);
  };

  const handleBack = () => {
    if (step === 'match') {
      setStep('tournament');
      setSelectedMatchId('');
      setMatches([]);
    } else if (step === 'tournament') {
      setStep('config');
      setSelectedTournamentId('');
      setTournaments([]);
    }
  };

  const getMatchDisplayName = (match: ScoreForgeMatch) => {
    const p1 = match.participant1?.displayName || 'TBD';
    const p2 = match.participant2?.displayName || 'TBD';
    const court = match.court ? ` [${match.court}]` : '';
    const status = match.status === 'live' ? ' (LIVE)' : '';
    return `${p1} vs ${p2}${court}${status}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              ScoreForge Connection
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center mb-6">
            {['config', 'tournament', 'match', 'connected'].map((s, i) => (
              <React.Fragment key={s}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === s
                      ? 'bg-blue-600 text-white'
                      : ['config', 'tournament', 'match', 'connected'].indexOf(step) > i
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}
                >
                  {i + 1}
                </div>
                {i < 3 && (
                  <div
                    className={`w-12 h-1 ${
                      ['config', 'tournament', 'match', 'connected'].indexOf(step) > i
                        ? 'bg-green-500'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Step 1: Configuration */}
          {step === 'config' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="sf_xxxxxxxxxxxx"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKey ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Generate an API key from ScoreForge Settings page
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Convex URL
                </label>
                <input
                  type="text"
                  value={convexUrl}
                  onChange={(e) => setConvexUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://your-project.convex.cloud"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Poll Interval (seconds)
                </label>
                <input
                  type="number"
                  value={pollInterval}
                  onChange={(e) => setPollInterval(Math.max(1, parseInt(e.target.value) || 2))}
                  min={1}
                  max={60}
                  className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleTestConnection}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {loading ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Tournament Selection */}
          {step === 'tournament' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Tournament
                </label>
                {tournaments.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No active tournaments found. Create a tournament in ScoreForge first.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {tournaments.map((tournament) => (
                      <button
                        key={tournament.id}
                        onClick={() => handleSelectTournament(tournament.id)}
                        disabled={loading}
                        className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {tournament.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {tournament.sport} - {tournament.format.replace('_', ' ')} - {tournament.participantCount} participants
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <button
                onClick={handleBack}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Back
              </button>
            </div>
          )}

          {/* Step 3: Match Selection */}
          {step === 'match' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="live">Live</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
                {availableCourts.length > 0 && (
                  <div className="flex-1">
                    <select
                      value={courtFilter}
                      onChange={(e) => setCourtFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="">All Courts</option>
                      {availableCourts.map((court) => (
                        <option key={court} value={court}>
                          {court}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Match ({filteredMatches.length} matches)
                </label>
                {filteredMatches.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No matches found with the current filters.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filteredMatches.map((match) => (
                      <button
                        key={match.id}
                        onClick={() => setSelectedMatchId(match.id)}
                        className={`w-full text-left p-3 border rounded-md transition-colors ${
                          selectedMatchId === match.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {getMatchDisplayName(match)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Round {match.round} - Match #{match.matchNumber}
                          {match.status === 'live' && (
                            <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded">
                              LIVE
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleConnect}
                  disabled={loading || !selectedMatchId}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {loading ? 'Connecting...' : 'Connect'}
                </button>
                <button
                  onClick={handleBack}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Connected */}
          {step === 'connected' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Connected to ScoreForge</span>
                </div>
                <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                  Live data is being polled from the selected match. The scoreboard will update automatically.
                </p>
              </div>

              {activeConnection && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p><strong>Connection ID:</strong> {activeConnection.id}</p>
                  <p><strong>Poll Interval:</strong> {activeConnection.pollInterval}s</p>
                  {activeConnection.lastUpdated && (
                    <p><strong>Last Updated:</strong> {new Date(activeConnection.lastUpdated).toLocaleTimeString()}</p>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleDisconnect}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Disconnect
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions footer */}
        {step === 'config' && (
          <div className="px-6 pb-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Getting Started
            </h3>
            <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
              <li>Go to ScoreForge web app Settings page</li>
              <li>Generate a new API key and copy it</li>
              <li>Find your Convex URL in the deployment settings</li>
              <li>Enter both values above and test the connection</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};
