import { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { PlayerScoutingView, type PlayerScoutingControls } from './PlayerScoutingView';
import { useTeams } from '@/hooks/useTeams';
import { getFavoriteTeam } from '@/db/teams';

function formatDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const y = String(date.getFullYear()).slice(-2);
  return `${m}/${d}/${y}`;
}

export function ScoutingView() {
  const { teams, loading } = useTeams();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Controls from PlayerScoutingView
  const controlsRef = useRef<PlayerScoutingControls>({
    refresh: () => {},
    loading: false,
    loadingProgress: null,
    lastFetched: null,
  });
  const [, forceUpdate] = useState(0);

  // On mount, auto-select the favorite team
  useEffect(() => {
    if (loading || initialized) return;
    setInitialized(true);

    getFavoriteTeam().then((fav) => {
      if (fav) {
        setSelectedTeamId(fav.id);
      } else if (teams.length > 0) {
        setSelectedTeamId(teams[0].id);
      }
    });
  }, [loading, initialized, teams]);

  // If selected team was deleted, fall back
  useEffect(() => {
    if (!initialized || loading) return;
    if (selectedTeamId && !teams.find((t) => t.id === selectedTeamId)) {
      const fav = teams.find((t) => t.favorite);
      setSelectedTeamId(fav?.id ?? teams[0]?.id ?? null);
    }
  }, [teams, selectedTeamId, initialized, loading]);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) ?? null;
  const { loading: refreshLoading, loadingProgress, lastFetched } = controlsRef.current;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-dota-text-secondary">Loading teams...</p>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Player Scouting</h2>
        <div className="card text-center py-12">
          <p className="text-dota-text-secondary mb-2">No teams available</p>
          <p className="text-sm text-dota-text-muted">
            Go to the Teams tab to create a team first
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-6">
          <h2 className="text-2xl font-bold">Player Scouting</h2>
          <select
            value={selectedTeamId ?? ''}
            onChange={(e) => setSelectedTeamId(e.target.value || null)}
            className="input-field py-1 text-sm"
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}{team.favorite ? ' ★' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4">
          {lastFetched && (
            <span className="text-xs text-dota-text-muted">
              Last updated {formatDate(lastFetched)}
            </span>
          )}
          <button
            onClick={() => controlsRef.current.refresh()}
            disabled={refreshLoading}
            className="btn-radiant flex items-center gap-2"
          >
            <RefreshCw size={16} className={refreshLoading ? 'animate-spin' : ''} />
            {refreshLoading
              ? loadingProgress
                ? `Fetching ${loadingProgress.current + 1}/${loadingProgress.total}...`
                : 'Fetching...'
              : 'Refresh Data for Selected Team'}
          </button>
        </div>
      </div>

      {selectedTeam && (
        <PlayerScoutingView
          team={selectedTeam}
          controlsRef={controlsRef}
          onControlsChange={() => forceUpdate((n) => n + 1)}
        />
      )}
    </div>
  );
}
