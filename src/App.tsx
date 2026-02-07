import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { YourTeamView } from './components/YourTeamView';
import { ScoutingView } from './components/ScoutingView';
import { TeamManagementView } from './components/TeamManagementView';
import { DraftAssistantView } from './components/DraftAssistantView';
import { DataManagementView } from './components/DataManagementView';
import { DraftProvider } from './contexts/DraftContext';
import type { Team } from './types';

function App() {
  const [view, setView] = useState<'yourTeam' | 'teams' | 'scouting' | 'draft' | 'data'>('yourTeam');

  // Scouting state
  const [selectedScoutingTeam, setSelectedScoutingTeam] = useState<Team | null>(null);

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
                  onClick={() => setView('yourTeam')}
                  className={`px-4 py-2 rounded transition-colors ${
                    view === 'yourTeam'
                      ? 'bg-dota-bg-tertiary text-dota-text-primary'
                      : 'text-dota-text-secondary hover:text-dota-text-primary'
                  }`}
                >
                  Your Team
                </button>
                <button
                  onClick={() => setView('teams')}
                  className={`px-4 py-2 rounded transition-colors ${
                    view === 'teams'
                      ? 'bg-dota-bg-tertiary text-dota-text-primary'
                      : 'text-dota-text-secondary hover:text-dota-text-primary'
                  }`}
                >
                  Other Teams
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
            {view === 'yourTeam' && <YourTeamView />}
            {view === 'teams' && <TeamManagementView />}
            {view === 'scouting' && (
              <ScoutingView
                selectedTeam={selectedScoutingTeam}
                onSelectTeam={setSelectedScoutingTeam}
              />
            )}
            {view === 'draft' && <DraftAssistantView />}
            {view === 'data' && <DataManagementView />}
          </ErrorBoundary>
        </main>
      </div>
    </DraftProvider>
  );
}

export default App;
