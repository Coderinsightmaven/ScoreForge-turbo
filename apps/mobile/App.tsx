import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text } from 'react-native';
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react';
import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

import { ConvexProvider } from './providers/ConvexProvider';
import { SignInScreen } from './screens/SignInScreen';
import { HomeScreen } from './screens/HomeScreen';
import { TempScorerHomeScreen } from './screens/TempScorerHomeScreen';
import {
  TempScorerContext,
  TempScorerSession,
  TempScorerContextType,
} from './contexts/TempScorerContext';

import './global.css';

// Re-export for backwards compatibility
export type { TempScorerSession } from './contexts/TempScorerContext';
export { useTempScorer } from './contexts/TempScorerContext';

const TEMP_SCORER_SESSION_KEY = 'tempScorerSession';

function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-900">
      <View className="mb-6 h-16 w-16 items-center justify-center rounded-2xl bg-amber-500">
        <Text className="text-3xl font-bold text-white">S</Text>
      </View>
      <ActivityIndicator size="large" color="#f59e0b" />
    </View>
  );
}

function AppContent() {
  const [tempScorerSession, setTempScorerSession] = useState<TempScorerSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Load temp scorer session from SecureStore on mount
  useEffect(() => {
    async function loadSession() {
      try {
        const sessionJson = await SecureStore.getItemAsync(TEMP_SCORER_SESSION_KEY);
        if (sessionJson) {
          const session = JSON.parse(sessionJson) as TempScorerSession;
          // Check if session is still valid
          if (session.expiresAt > Date.now()) {
            setTempScorerSession(session);
          } else {
            // Session expired, remove it
            await SecureStore.deleteItemAsync(TEMP_SCORER_SESSION_KEY);
          }
        }
      } catch (e) {
        console.error('Failed to load temp scorer session:', e);
      } finally {
        setIsLoadingSession(false);
      }
    }
    loadSession();
  }, []);

  // Save session to SecureStore when it changes
  const handleSetSession = async (session: TempScorerSession | null) => {
    setTempScorerSession(session);
    if (session) {
      await SecureStore.setItemAsync(TEMP_SCORER_SESSION_KEY, JSON.stringify(session));
    } else {
      await SecureStore.deleteItemAsync(TEMP_SCORER_SESSION_KEY);
    }
  };

  // Sign out temp scorer
  const handleSignOut = async () => {
    await SecureStore.deleteItemAsync(TEMP_SCORER_SESSION_KEY);
    setTempScorerSession(null);
  };

  const contextValue: TempScorerContextType = {
    session: tempScorerSession,
    setSession: handleSetSession,
    signOut: handleSignOut,
  };

  if (isLoadingSession) {
    return <LoadingScreen />;
  }

  // If we have a temp scorer session, show temp scorer UI
  if (tempScorerSession) {
    return (
      <TempScorerContext.Provider value={contextValue}>
        <TempScorerHomeScreen />
        <StatusBar style="light" />
      </TempScorerContext.Provider>
    );
  }

  // Otherwise, show regular auth flow
  return (
    <TempScorerContext.Provider value={contextValue}>
      <AuthLoading>
        <LoadingScreen />
      </AuthLoading>
      <Unauthenticated>
        <SignInScreen onTempScorerLogin={handleSetSession} />
      </Unauthenticated>
      <Authenticated>
        <HomeScreen />
      </Authenticated>
      <StatusBar style="light" />
    </TempScorerContext.Provider>
  );
}

export default function App() {
  return (
    <ConvexProvider>
      <AppContent />
    </ConvexProvider>
  );
}
