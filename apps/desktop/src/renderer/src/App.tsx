import { useEffect } from 'react';
import { useSyncStore } from './stores/sync-store';
import { TitleBar } from './components/TitleBar';
import { AuthView } from './components/AuthView';
import { MainView } from './components/MainView';
import { LoadingSpinner } from './components/LoadingSpinner';

export default function App() {
  const { initialize, isLoading, authState, error } = useSyncStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      <TitleBar />
      
      {error && (
        <div className="bg-red-500/20 text-red-400 px-4 py-2 text-sm">
          {error}
        </div>
      )}
      
      {authState.isAuthenticated ? <MainView /> : <AuthView />}
    </div>
  );
}
