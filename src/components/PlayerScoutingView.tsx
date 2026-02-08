import { useState, useEffect, useCallback, type MutableRefObject } from 'react';
import { Search } from 'lucide-react';
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

export interface PlayerScoutingControls {
  refresh: () => void;
  loading: boolean;
  loadingProgress: { current: number; total: number; currentPlayer: string | null } | null;
  lastFetched: Date | null;
}

interface PlayerScoutingViewProps {
  team: Team;
  controlsRef?: MutableRefObject<PlayerScoutingControls>;
  onControlsChange?: () => void;
}

export function PlayerScoutingView({ team, controlsRef, onControlsChange }: PlayerScoutingViewProps) {
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
      </div>
    );
  }

  const { heroStatsMap, players, loading, loadingProgress, error, lastFetched, refetch } = usePlayerData({
    steamIds: team.playerIds,
    altAccountMap: team.altAccountMap,
    lobbyTypeFilter,
    timeWindowFilter,
  });

  const { heroes, loading: heroesLoading } = useHeroes();

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Expose controls to parent
  useEffect(() => {
    if (controlsRef) {
      controlsRef.current = { refresh: handleRefresh, loading, loadingProgress, lastFetched };
      onControlsChange?.();
    }
  }, [handleRefresh, controlsRef, onControlsChange, loading, loadingProgress, lastFetched]);

  const hasData = heroStatsMap.size > 0 && Array.from(heroStatsMap.values()).some(stats => stats.length > 0);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card !p-6">
        <h3 className="text-sm font-semibold text-dota-text-secondary uppercase tracking-wider mb-4">
          Filters
        </h3>
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Left group: Time Period + Game Type */}
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Time Window Filter */}
            <div className="w-36">
              <label className="block text-sm font-medium mb-2.5">
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
              <p className="text-xs text-dota-text-muted mt-2">
                Up to 500 games
              </p>
            </div>

            {/* Lobby Type Filter */}
            <div>
              <label className="block text-sm font-medium mb-2.5">
                Game Type
              </label>
              <LobbyTypeToggle value={lobbyTypeFilter} onChange={setLobbyTypeFilter} />
              <p className="text-xs text-dota-text-muted mt-2">
                {lobbyTypeFilter === 'competitive'
                  ? 'Practice lobbies + tournament only'
                  : 'All types (excludes Turbo)'}
              </p>
            </div>
          </div>

          {/* Spacer */}
          <div className="hidden md:block flex-1" />

          {/* Search Filter - right aligned */}
          <div className="w-full sm:w-64">
            <label className="block text-sm font-medium mb-2.5 flex items-center gap-2">
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
            <p className="text-xs text-dota-text-muted mt-2">
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
          playerIds={team.playerIds}
          heroes={heroes}
        />
      )}
    </div>
  );
}
