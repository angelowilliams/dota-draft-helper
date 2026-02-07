import { useState, useEffect } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { PlayerHeroList } from './PlayerHeroList';
import { MatchHistory } from './MatchHistory';
import { LobbyTypeToggle } from './ui/LobbyTypeToggle';
import { usePlayerData } from '@/hooks/usePlayerData';
import { useHeroes } from '@/hooks/useHeroes';
import { updateTeam } from '@/db/teams';
import type { Team, LobbyTypeFilter, TimeWindowFilter } from '@/types';

const TIME_WINDOW_OPTIONS: { value: TimeWindowFilter; label: string }[] = [
  { value: 'month', label: 'Last Month' },
  { value: 'threeMonths', label: 'Last 3 Months' },
  { value: 'year', label: 'Last Year' },
];

interface PlayerScoutingViewProps {
  team: Team;
  onBack: () => void;
}

export function PlayerScoutingView({ team, onBack }: PlayerScoutingViewProps) {
  const [searchFilter, setSearchFilter] = useState('');
  const [lobbyTypeFilter, setLobbyTypeFilter] = useState<LobbyTypeFilter>('all');
  const [timeWindowFilter, setTimeWindowFilter] = useState<TimeWindowFilter>('threeMonths');
  const [orderedPlayerIds, setOrderedPlayerIds] = useState<string[]>(team.playerIds);

  // Sync when team.playerIds changes (e.g. team edited externally)
  useEffect(() => {
    setOrderedPlayerIds(team.playerIds);
  }, [team.playerIds]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = orderedPlayerIds.indexOf(active.id as string);
      const newIndex = orderedPlayerIds.indexOf(over.id as string);
      const newOrder = arrayMove(orderedPlayerIds, oldIndex, newIndex);
      setOrderedPlayerIds(newOrder);
      updateTeam(team.id, { playerIds: newOrder });
    }
  };

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

  const { heroStatsMap, players, loading, loadingProgress, error, refetch } = usePlayerData({
    steamIds: team.playerIds,
    lobbyTypeFilter,
    timeWindowFilter,
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
          {loading
            ? loadingProgress
              ? `Fetching player ${loadingProgress.current + 1}/${loadingProgress.total}...`
              : 'Fetching...'
            : 'Refresh Player Data'}
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Time Window Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Time Period
            </label>
            <select
              value={timeWindowFilter}
              onChange={(e) => setTimeWindowFilter(e.target.value as TimeWindowFilter)}
              className="input-field w-full"
            >
              {TIME_WINDOW_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-dota-text-muted mt-1">
              Up to 500 games per player
            </p>
          </div>

          {/* Lobby Type Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Game Type
            </label>
            <LobbyTypeToggle value={lobbyTypeFilter} onChange={setLobbyTypeFilter} />
            <p className="text-xs text-dota-text-muted mt-1">
              {lobbyTypeFilter === 'competitive'
                ? 'Practice lobbies + tournament only'
                : 'All types (excludes Turbo)'}
            </p>
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

      {/* Loading Progress */}
      {loading && loadingProgress && (
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-dota-text-secondary">
                  Fetching player data...
                </span>
                <span className="text-dota-text-primary">
                  {loadingProgress.current}/{loadingProgress.total} players
                </span>
              </div>
              <div className="w-full bg-dota-bg-tertiary rounded-full h-2">
                <div
                  className="bg-radiant h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(loadingProgress.current / loadingProgress.total) * 100}%`,
                  }}
                />
              </div>
              {loadingProgress.currentPlayer && (
                <p className="text-xs text-dota-text-muted mt-2">
                  Currently fetching: {loadingProgress.currentPlayer}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="card bg-dire bg-opacity-20 border-dire">
          <p className="text-dire">Error: {error}</p>
          <p className="text-sm text-dota-text-secondary mt-2">
            Check your OpenDota API key and try again.
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
            Click "Refresh Data" to fetch player statistics from OpenDota
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={orderedPlayerIds}
            strategy={horizontalListSortingStrategy}
          >
            <div className="grid grid-cols-5 gap-4">
              {orderedPlayerIds.map((steamId) => {
                const stats = heroStatsMap.get(steamId) || [];
                const player = players.get(steamId);
                return (
                  <PlayerHeroList
                    key={steamId}
                    id={steamId}
                    steamId={steamId}
                    player={player}
                    heroStats={stats}
                    heroes={heroes}
                    searchFilter={searchFilter}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
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
