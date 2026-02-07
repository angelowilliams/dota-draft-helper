import { useState, useEffect } from 'react';
import { PlayerScoutingView } from './PlayerScoutingView';
import { useTeams } from '@/hooks/useTeams';
import { getFavoriteTeam } from '@/db/teams';

export function ScoutingView() {
  const { teams, loading } = useTeams();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

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
      {/* Header with team selector */}
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">Player Scouting</h2>
        <select
          value={selectedTeamId ?? ''}
          onChange={(e) => setSelectedTeamId(e.target.value || null)}
          className="input-field"
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}{team.favorite ? ' ★' : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedTeam && <PlayerScoutingView team={selectedTeam} />}
    </div>
  );
}
