import { useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { PlayerHeroList } from './PlayerHeroList';
import { MatchHistory } from './MatchHistory';
import { usePlayerData } from '@/hooks/usePlayerData';
import { useHeroes } from '@/hooks/useHeroes';
import type { Team, LobbyTypeFilter } from '@/types';

interface PlayerScoutingViewProps {
  team: Team;
  onBack: () => void;
}

export function PlayerScoutingView({ team, onBack }: PlayerScoutingViewProps) {
  const [searchFilter, setSearchFilter] = useState('');
  const [lobbyTypeFilter, setLobbyTypeFilter] = useState<LobbyTypeFilter>('all');

  // Validate team data
  if (!team || !team.playerIds || team.playerIds.length === 0) {
    return (
      <div className="card bg-dire bg-opacity-20 border-dire">
        <p className="text-dire">Invalid team data. Please select a valid team.</p>
        <button onClick={onBack} className="btn-primary mt-4">
          Back to Teams
        </button>
      </div>
    );
  }

  const { heroStatsMap, players, loading, error, refetch } = usePlayerData({
    steamIds: team.playerIds,
    lobbyTypeFilter,
  });

  const { heroes, loading: heroesLoading } = useHeroes();

  const handleRefresh = async () => {
    await refetch();
  };

  const hasData = heroStatsMap.size > 0 && Array.from(heroStatsMap.values()).some(stats => stats.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-dota-text-secondary hover:text-dota-text-primary mb-2 text-sm"
          >
            ← Back to Team Selection
          </button>
          <h2 className="text-2xl font-bold">{team.name}</h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="btn-radiant flex items-center gap-2"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Fetching...' : 'Refresh Player Data'}
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Info */}
          <div>
            <p className="text-sm text-dota-text-secondary">
              Showing statistics from past 100 games per player
            </p>
            <p className="text-xs text-dota-text-muted mt-1">
              {lobbyTypeFilter === 'competitive'
                ? 'Competitive matches only (tournament/league)'
                : 'Includes ranked, unranked, and competitive matches (excludes Turbo mode)'}
            </p>
          </div>

          {/* Lobby Type Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Game Type Filter
            </label>
            <div className="inline-flex rounded-lg border-2 border-dota-bg-tertiary bg-dota-bg-primary overflow-hidden">
              <button
                onClick={() => setLobbyTypeFilter('all')}
                className={`px-6 py-2 text-sm font-semibold transition-all ${
                  lobbyTypeFilter === 'all'
                    ? 'bg-radiant text-black shadow-lg'
                    : 'bg-transparent text-dota-text-secondary hover:text-dota-text-primary hover:bg-dota-bg-tertiary'
                }`}
              >
                All Games
              </button>
              <button
                onClick={() => setLobbyTypeFilter('competitive')}
                className={`px-6 py-2 text-sm font-semibold transition-all border-l-2 border-dota-bg-tertiary ${
                  lobbyTypeFilter === 'competitive'
                    ? 'bg-radiant text-black shadow-lg'
                    : 'bg-transparent text-dota-text-secondary hover:text-dota-text-primary hover:bg-dota-bg-tertiary'
                }`}
              >
                Competitive
              </button>
            </div>
          </div>

          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Search size={16} />
              Search Hero
            </label>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter by hero name..."
              className="input-field w-full"
            />
            <p className="text-xs text-dota-text-muted mt-1">
              {searchFilter && `Filtering heroes matching "${searchFilter}"`}
            </p>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="card bg-dire bg-opacity-20 border-dire">
          <p className="text-dire">Error: {error}</p>
          <p className="text-sm text-dota-text-secondary mt-2">
            Check your STRATZ API token and try again.
          </p>
        </div>
      )}

      {/* Player Hero Lists */}
      {heroesLoading ? (
        <div className="text-center py-8 text-dota-text-secondary">
          <p>Loading heroes...</p>
        </div>
      ) : !hasData && !loading ? (
        <div className="card text-center py-8 text-dota-text-secondary">
          <p className="mb-2">No data available</p>
          <p className="text-sm text-dota-text-muted">
            Click "Refresh Data" to fetch player statistics from STRATZ
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-4">
          {team.playerIds.map((steamId) => {
            const stats = heroStatsMap.get(steamId) || [];
            const player = players.get(steamId);
            return (
              <PlayerHeroList
                key={steamId}
                steamId={steamId}
                player={player}
                heroStats={stats}
                heroes={heroes}
                searchFilter={searchFilter}
              />
            );
          })}
        </div>
      )}

      {/* Team Match History */}
      {team.teamId && (
        <MatchHistory
          teamId={team.teamId}
          teamName={team.name}
          heroes={heroes}
        />
      )}
    </div>
  );
}
