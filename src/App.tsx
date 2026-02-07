import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TeamsView } from './components/TeamsView';
import { ScoutingView } from './components/ScoutingView';
import { DraftAssistantView } from './components/DraftAssistantView';
import { DataManagementView } from './components/DataManagementView';
import { DraftProvider } from './contexts/DraftContext';

function App() {
  const [view, setView] = useState<'teams' | 'scouting' | 'draft' | 'data'>('teams');

  useEffect(() => {
    if (!import.meta.env.VITE_OPENDOTA_API_KEY) {
      toast.error('OpenDota API key missing. Set VITE_OPENDOTA_API_KEY in .env and restart the dev server.', {
        duration: Infinity,
        id: 'missing-api-key',
      });
    }
  }, []);

  return (
    <DraftProvider>
      <div className="min-h-screen bg-dota-bg-primary">
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'bg-dota-bg-secondary text-dota-text-primary',
          }}
        />

        <header className="bg-dota-bg-secondary border-b border-dota-bg-tertiary">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-dota-text-primary">
                Dota 2 Draft Helper
              </h1>

              <nav className="flex gap-4">
                <button
                  onClick={() => setView('teams')}
                  className={`px-4 py-2 rounded transition-colors ${
                    view === 'teams'
                      ? 'bg-dota-bg-tertiary text-dota-text-primary'
                      : 'text-dota-text-secondary hover:text-dota-text-primary'
                  }`}
                >
                  Teams
                </button>
                <button
                  onClick={() => setView('scouting')}
                  className={`px-4 py-2 rounded transition-colors ${
                    view === 'scouting'
                      ? 'bg-dota-bg-tertiary text-dota-text-primary'
                      : 'text-dota-text-secondary hover:text-dota-text-primary'
                  }`}
                >
                  Scouting
                </button>
                <button
                  onClick={() => setView('draft')}
                  className={`px-4 py-2 rounded transition-colors ${
                    view === 'draft'
                      ? 'bg-dota-bg-tertiary text-dota-text-primary'
                      : 'text-dota-text-secondary hover:text-dota-text-primary'
                  }`}
                >
                  Draft Assistant
                </button>
                <button
                  onClick={() => setView('data')}
                  className={`px-4 py-2 rounded transition-colors ${
                    view === 'data'
                      ? 'bg-dota-bg-tertiary text-dota-text-primary'
                      : 'text-dota-text-secondary hover:text-dota-text-primary'
                  }`}
                >
                  Data Management
                </button>
              </nav>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <ErrorBoundary>
            {view === 'teams' && <TeamsView />}
            {view === 'scouting' && <ScoutingView />}
            {view === 'draft' && <DraftAssistantView />}
            {view === 'data' && <DataManagementView />}
          </ErrorBoundary>
        </main>
      </div>
    </DraftProvider>
  );
}

export default App;
