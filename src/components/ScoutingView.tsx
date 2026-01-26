import { PlayerScoutingView } from './PlayerScoutingView';
import { useTeams } from '@/hooks/useTeams';
import type { Team } from '@/types';

interface ScoutingViewProps {
  selectedTeam: Team | null;
  onSelectTeam: (team: Team | null) => void;
}

export function ScoutingView({ selectedTeam, onSelectTeam }: ScoutingViewProps) {
  const { teams, loading } = useTeams();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-dota-text-secondary">Loading teams...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selectedTeam ? (
        <PlayerScoutingView
          team={selectedTeam}
          onBack={() => onSelectTeam(null)}
        />
      ) : (
        <>
          <div>
            <h2 className="text-2xl font-bold mb-2">Player Scouting</h2>
            <p className="text-dota-text-secondary text-sm">
              Select a team to view player hero statistics
            </p>
          </div>

          {teams.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-dota-text-secondary mb-2">No teams available</p>
              <p className="text-sm text-dota-text-muted">
                Go to the Teams tab to create a team first
              </p>
            </div>
          ) : (
            <div className="card">
              <label className="block text-sm font-medium mb-2">Select Team</label>
              <select
                value=""
                onChange={(e) => {
                  const team = teams.find((t) => t.id === e.target.value);
                  onSelectTeam(team || null);
                }}
                className="input-field w-full max-w-md"
              >
                <option value="">Choose a team...</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                    {team.teamId ? ` (Team ID: ${team.teamId})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}
    </div>
  );
}
