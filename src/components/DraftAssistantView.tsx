import { useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import { useTeams } from '@/hooks/useTeams';
import { useHeroes } from '@/hooks/useHeroes';
import { usePlayerData } from '@/hooks/usePlayerData';
import { CAPTAIN_MODE_DRAFT_ORDER } from '@/config/draftOrder';
import { getHeroPortraitUrl } from '@/config/heroes';
import type { Hero, HeroStats, Player, LobbyTypeFilter } from '@/types';

interface PlayerHeroListWithHighlightProps {
  steamId: string;
  player?: Player;
  heroStats: HeroStats[];
  heroes: Hero[];
  bannedHeroIds: Set<number>;
  pickedByThisTeam: Set<number>;
  pickedByOpponent: Set<number>;
  manualHeroList?: number[]; // Ordered list of hero IDs for manual lists
}

function PlayerHeroListWithHighlight({
  steamId,
  player,
  heroStats,
  heroes,
  bannedHeroIds,
  pickedByThisTeam,
  pickedByOpponent,
  manualHeroList,
}: PlayerHeroListWithHighlightProps) {
  const sortedHeroes = useMemo(() => {
    if (!heroes || !Array.isArray(heroes)) {
      return [];
    }

    // If manual hero list is provided, use that order
    if (manualHeroList && Array.isArray(manualHeroList) && manualHeroList.length > 0) {
      return manualHeroList
        .map((heroId) => {
          const hero = heroes.find((h) => h.id === heroId);
          if (!hero) return null;

          // Find stats for this hero
          const stat = heroStats?.find((s) => s.heroId === heroId);

          return {
            hero,
            stat: stat || {
              steamId,
              heroId,
              lobbyTypeFilter: 'all' as const,
              pubGames: 0,
              competitiveGames: 0,
              wins: 0,
              avgImp: 0,
            },
            totalGames: stat ? stat.pubGames + stat.competitiveGames : 0,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
    }

    // Otherwise, use parsed hero stats
    if (!heroStats || !Array.isArray(heroStats)) {
      return [];
    }

    return heroStats
      .map((stat) => {
        if (!stat || typeof stat.heroId !== 'number') {
          return null;
        }

        const hero = heroes.find((h) => h.id === stat.heroId);
        if (!hero) return null;

        return {
          hero,
          stat,
          totalGames: stat.pubGames + stat.competitiveGames,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.totalGames - a.totalGames);
  }, [heroStats, heroes, manualHeroList, steamId]);

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="text-base font-semibold">
          <a
            href={`https://stratz.com/players/${steamId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-radiant hover:text-radiant-light transition-colors"
          >
            {player?.name || `Player ${steamId.slice(-4)}`}
          </a>
        </h3>
      </div>

      {sortedHeroes.length === 0 ? (
        <div className="text-center py-8 text-dota-text-secondary">
          <p className="text-sm">No hero data</p>
        </div>
      ) : (
        <div>
          {/* Header Row */}
          <div className="flex items-center gap-2 pb-2 border-b border-dota-bg-tertiary text-xs font-medium text-dota-text-muted">
            <div className="flex-shrink-0" style={{ width: '48px' }}>
              {/* Hero image space */}
            </div>
            <div className="flex-1 grid grid-cols-4 gap-2 text-center">
              <div>Total</div>
              <div>Comp</div>
              <div>Win%</div>
              <div>IMP</div>
            </div>
          </div>

          {/* Scrollable Hero Rows */}
          <div className="space-y-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: '580px' }}>
            {sortedHeroes.map(({ hero, stat, totalGames }) => {
              const isBanned = bannedHeroIds.has(hero.id);
              const isPickedByThisTeam = pickedByThisTeam.has(hero.id);
              const isPickedByOpponent = pickedByOpponent.has(hero.id);

              let bgClass = 'hover:bg-dota-bg-tertiary';
              let borderClass = '';
              let imgClass = 'rounded flex-shrink-0';

              if (isBanned || isPickedByOpponent) {
                // Banned or picked by opponent: light red background, grayed portrait
                bgClass = 'bg-red-900 bg-opacity-20';
                imgClass = 'rounded flex-shrink-0 grayscale opacity-60';
              } else if (isPickedByThisTeam) {
                // Picked by this team: green highlight
                bgClass = 'bg-green-500 bg-opacity-20';
                borderClass = 'border border-green-500';
              }

              return (
                <div
                  key={hero.id}
                  className={`flex items-center gap-2 p-1 rounded transition-colors ${bgClass} ${borderClass}`}
                  title={hero.displayName}
                >
                  <img
                    src={getHeroPortraitUrl(hero.id)}
                    alt={hero.displayName}
                    className={imgClass}
                    style={{ width: 'auto', height: 'auto', maxWidth: '48px' }}
                  />
                  <div className="flex-1 grid grid-cols-4 gap-2 text-xs text-center">
                    <div className="font-medium text-dota-text-primary">{totalGames}</div>
                    <div className="text-radiant font-medium">{stat.competitiveGames}</div>
                    <div className="text-dota-text-secondary">
                      {stat.wins !== undefined && totalGames > 0
                        ? `${Math.round((stat.wins / totalGames) * 100)}%`
                        : '-'}
                    </div>
                    <div className="text-dota-text-secondary">
                      {stat.avgImp !== undefined ? stat.avgImp.toFixed(0) : '-'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface DraftAssistantViewProps {
  firstPickTeamId: string;
  secondPickTeamId: string;
  draftState: Map<number, number>;
  selectedCell: number | null;
  searchQuery: string;
  lobbyTypeFilter: LobbyTypeFilter;
  onFirstPickTeamChange: (id: string) => void;
  onSecondPickTeamChange: (id: string) => void;
  onDraftStateChange: (state: Map<number, number>) => void;
  onSelectedCellChange: (cell: number | null) => void;
  onSearchQueryChange: (query: string) => void;
  onLobbyTypeFilterChange: (filter: LobbyTypeFilter) => void;
}

export function DraftAssistantView({
  firstPickTeamId,
  secondPickTeamId,
  draftState,
  selectedCell,
  searchQuery,
  lobbyTypeFilter,
  onFirstPickTeamChange,
  onSecondPickTeamChange,
  onDraftStateChange,
  onSelectedCellChange,
  onSearchQueryChange,
  onLobbyTypeFilterChange,
}: DraftAssistantViewProps) {
  const { teams: allTeams } = useTeams();
  const { heroes } = useHeroes();

  // Sort teams to show "Your Team" first
  const teams = useMemo(() => {
    return [...allTeams].sort((a, b) => {
      if (a.yourTeam && !b.yourTeam) return -1;
      if (!a.yourTeam && b.yourTeam) return 1;
      return 0;
    });
  }, [allTeams]);

  const firstPickTeam = teams.find(t => t.id === firstPickTeamId);
  const secondPickTeam = teams.find(t => t.id === secondPickTeamId);

  // Fetch player data for both teams
  const firstPickPlayerData = usePlayerData({
    steamIds: firstPickTeam?.playerIds || [],
    autoFetch: false,
    lobbyTypeFilter,
  });

  const secondPickPlayerData = usePlayerData({
    steamIds: secondPickTeam?.playerIds || [],
    autoFetch: false,
    lobbyTypeFilter,
  });

  const selectedHeroIds = new Set(Array.from(draftState.values()));

  const filteredHeroes = heroes.filter(hero => {
    // Remove already picked/banned heroes
    if (selectedHeroIds.has(hero.id)) return false;

    // Apply search filter
    if (searchQuery) {
      const lowerSearch = searchQuery.toLowerCase();
      return hero.displayName.toLowerCase().startsWith(lowerSearch) ||
             hero.name.toLowerCase().startsWith(lowerSearch);
    }
    return true;
  });

  const handleCellClick = (order: number) => {
    onSelectedCellChange(order);
    onSearchQueryChange('');
  };

  const handleHeroSelect = (heroId: number) => {
    if (selectedCell !== null) {
      const newDraftState = new Map(draftState);
      newDraftState.set(selectedCell, heroId);
      onDraftStateChange(newDraftState);
      onSelectedCellChange(null);
      onSearchQueryChange('');
    }
  };

  const handleResetDraft = () => {
    onDraftStateChange(new Map());
    onSelectedCellChange(null);
    onSearchQueryChange('');
  };

  const handleResetTeams = () => {
    onFirstPickTeamChange('');
    onSecondPickTeamChange('');
    onDraftStateChange(new Map());
    onSelectedCellChange(null);
    onSearchQueryChange('');
  };

  // Team selection screen
  if (!firstPickTeamId || !secondPickTeamId) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Draft Assistant</h2>

        <div className="card max-w-2xl">
          <h3 className="text-lg font-semibold mb-4">Select Teams</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                First Pick Team
              </label>
              <select
                value={firstPickTeamId}
                onChange={(e) => onFirstPickTeamChange(e.target.value)}
                className="input-field w-full"
              >
                <option value="">Select a team...</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id} disabled={team.id === secondPickTeamId}>
                    {team.yourTeam ? `${team.name} (Your Team)` : team.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Second Pick Team
              </label>
              <select
                value={secondPickTeamId}
                onChange={(e) => onSecondPickTeamChange(e.target.value)}
                className="input-field w-full"
              >
                <option value="">Select a team...</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id} disabled={team.id === firstPickTeamId}>
                    {team.yourTeam ? `${team.name} (Your Team)` : team.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Game Type Filter
              </label>
              <div className="inline-flex rounded-lg border-2 border-dota-bg-tertiary bg-dota-bg-primary overflow-hidden">
                <button
                  onClick={() => onLobbyTypeFilterChange('all')}
                  className={`px-6 py-2 text-sm font-semibold transition-all ${
                    lobbyTypeFilter === 'all'
                      ? 'bg-radiant text-black shadow-lg'
                      : 'bg-transparent text-dota-text-secondary hover:text-dota-text-primary hover:bg-dota-bg-tertiary'
                  }`}
                >
                  All Games
                </button>
                <button
                  onClick={() => onLobbyTypeFilterChange('competitive')}
                  className={`px-6 py-2 text-sm font-semibold transition-all border-l-2 border-dota-bg-tertiary ${
                    lobbyTypeFilter === 'competitive'
                      ? 'bg-radiant text-black shadow-lg'
                      : 'bg-transparent text-dota-text-secondary hover:text-dota-bg-tertiary hover:text-dota-text-primary'
                  }`}
                >
                  Competitive
                </button>
              </div>
            </div>

            {firstPickTeamId && secondPickTeamId && (
              <button
                onClick={() => {
                  // Load player data when teams are selected
                  firstPickPlayerData.refetch();
                  secondPickPlayerData.refetch();
                }}
                className="btn-radiant w-full"
              >
                Start Draft
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Build draft actions separated by team
  const firstPickActions: Array<{ order: number; heroId: number | null }> = [];
  const secondPickActions: Array<{ order: number; heroId: number | null }> = [];
  const bannedHeroIds = new Set<number>();
  const firstPickPickedHeroIds = new Set<number>();
  const secondPickPickedHeroIds = new Set<number>();

  CAPTAIN_MODE_DRAFT_ORDER.forEach((phase) => {
    const heroId = draftState.get(phase.order) || null;

    if (heroId) {
      if (phase.type === 'ban') {
        bannedHeroIds.add(heroId);
      } else if (phase.type === 'pick') {
        if (phase.team === 'firstPick') {
          firstPickPickedHeroIds.add(heroId);
        } else {
          secondPickPickedHeroIds.add(heroId);
        }
      }
    }

    if (phase.team === 'firstPick') {
      firstPickActions.push({ order: phase.order, heroId });
    } else {
      secondPickActions.push({ order: phase.order, heroId });
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Draft Assistant</h2>
        <div className="flex gap-2">
          <button
            onClick={handleResetDraft}
            className="btn-primary flex items-center gap-2"
          >
            <RotateCcw size={18} />
            Reset Draft
          </button>
          <button
            onClick={handleResetTeams}
            className="btn-primary"
          >
            Change Teams
          </button>
        </div>
      </div>

      {/* Draft Grid */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Draft Progress</h3>

        <div className="space-y-2">
          {/* First Pick Row */}
          <div>
            <div className="text-sm font-semibold text-radiant mb-1">
              {firstPickTeam?.name} (First Pick)
            </div>
            <div className="flex gap-2">
              {firstPickActions.map((action) => {
                const phase = CAPTAIN_MODE_DRAFT_ORDER.find(p => p.order === action.order);
                const isBan = phase?.type === 'ban';
                const isSelected = selectedCell === action.order;

                return (
                  <div
                    key={action.order}
                    onClick={() => handleCellClick(action.order)}
                    className={`relative flex-shrink-0 cursor-pointer rounded ${
                      isSelected
                        ? 'border-2 border-yellow-500'
                        : !isBan
                        ? 'border-2 border-radiant'
                        : 'border border-dota-bg-tertiary'
                    }`}
                    style={{ width: '64px', height: '36px' }}
                  >
                    {action.heroId ? (
                      <>
                        <img
                          src={getHeroPortraitUrl(action.heroId)}
                          alt=""
                          className={`rounded w-full h-full ${
                            isBan ? 'opacity-50 grayscale' : ''
                          }`}
                          style={{ objectFit: 'cover' }}
                        />
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-radiant text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-md">
                          {action.order}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-dota-bg-tertiary rounded">
                        <span className="text-xs text-dota-text-muted">{action.order}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Second Pick Row */}
          <div>
            <div className="text-sm font-semibold text-dire mb-1">
              {secondPickTeam?.name} (Second Pick)
            </div>
            <div className="flex gap-2">
              {secondPickActions.map((action) => {
                const phase = CAPTAIN_MODE_DRAFT_ORDER.find(p => p.order === action.order);
                const isBan = phase?.type === 'ban';
                const isSelected = selectedCell === action.order;

                return (
                  <div
                    key={action.order}
                    onClick={() => handleCellClick(action.order)}
                    className={`relative flex-shrink-0 cursor-pointer rounded ${
                      isSelected
                        ? 'border-2 border-yellow-500'
                        : !isBan
                        ? 'border-2 border-dire'
                        : 'border border-dota-bg-tertiary'
                    }`}
                    style={{ width: '64px', height: '36px' }}
                  >
                    {action.heroId ? (
                      <>
                        <img
                          src={getHeroPortraitUrl(action.heroId)}
                          alt=""
                          className={`rounded w-full h-full ${
                            isBan ? 'opacity-50 grayscale' : ''
                          }`}
                          style={{ objectFit: 'cover' }}
                        />
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-dire text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-md">
                          {action.order}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-dota-bg-tertiary rounded">
                        <span className="text-xs text-dota-text-muted">{action.order}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Hero Selection Dropdown */}
        {selectedCell !== null && (
          <div className="mt-4 p-4 bg-dota-bg-tertiary rounded">
            <label className="block text-sm font-medium mb-2">
              Select Hero for Position #{selectedCell}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Type hero name..."
              className="input-field w-full mb-2"
              autoFocus
            />
            <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-1">
              {filteredHeroes.map(hero => (
                <button
                  key={hero.id}
                  onClick={() => handleHeroSelect(hero.id)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-dota-bg-primary transition-colors flex items-center gap-2"
                >
                  <img
                    src={getHeroPortraitUrl(hero.id)}
                    alt={hero.displayName}
                    className="rounded"
                    style={{ width: '32px', height: 'auto' }}
                  />
                  <span>{hero.displayName}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Scouting Views with Highlighting */}
      <div className="space-y-6">
        {/* Show opponent team first if Your Team is selected */}
        {firstPickTeam?.yourTeam ? (
          <>
            {/* Second Pick Team Stats (Opponent) */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">
                {secondPickTeam?.name} Player Stats
              </h3>
              <div className="grid grid-cols-5 gap-4">
                {secondPickTeam?.playerIds.map((steamId, idx) => {
                  const stats = secondPickPlayerData.heroStatsMap.get(steamId) || [];
                  const player = secondPickPlayerData.players.get(steamId);
                  const manualList = secondPickTeam?.manualHeroLists?.[idx];
                  return (
                    <PlayerHeroListWithHighlight
                      key={steamId}
                      steamId={steamId}
                      player={player}
                      heroStats={stats}
                      heroes={heroes}
                      bannedHeroIds={bannedHeroIds}
                      pickedByThisTeam={secondPickPickedHeroIds}
                      pickedByOpponent={firstPickPickedHeroIds}
                      manualHeroList={manualList}
                    />
                  );
                })}
              </div>
            </div>

            {/* First Pick Team Stats (Your Team) */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">
                {firstPickTeam?.name} Player Stats
                <span className="text-sm text-radiant ml-2">(Your Team - Manual List)</span>
              </h3>
              <div className="grid grid-cols-5 gap-4">
                {firstPickTeam?.playerIds.map((steamId, idx) => {
                  const stats = firstPickPlayerData.heroStatsMap.get(steamId) || [];
                  const player = firstPickPlayerData.players.get(steamId);
                  const manualList = firstPickTeam?.manualHeroLists?.[idx];
                  return (
                    <PlayerHeroListWithHighlight
                      key={steamId}
                      steamId={steamId}
                      player={player}
                      heroStats={stats}
                      heroes={heroes}
                      bannedHeroIds={bannedHeroIds}
                      pickedByThisTeam={firstPickPickedHeroIds}
                      pickedByOpponent={secondPickPickedHeroIds}
                      manualHeroList={manualList}
                    />
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* First Pick Team Stats */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">
                {firstPickTeam?.name} Player Stats
              </h3>
              <div className="grid grid-cols-5 gap-4">
                {firstPickTeam?.playerIds.map((steamId, idx) => {
                  const stats = firstPickPlayerData.heroStatsMap.get(steamId) || [];
                  const player = firstPickPlayerData.players.get(steamId);
                  const manualList = firstPickTeam?.manualHeroLists?.[idx];
                  return (
                    <PlayerHeroListWithHighlight
                      key={steamId}
                      steamId={steamId}
                      player={player}
                      heroStats={stats}
                      heroes={heroes}
                      bannedHeroIds={bannedHeroIds}
                      pickedByThisTeam={firstPickPickedHeroIds}
                      pickedByOpponent={secondPickPickedHeroIds}
                      manualHeroList={manualList}
                    />
                  );
                })}
              </div>
            </div>

            {/* Second Pick Team Stats */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">
                {secondPickTeam?.name} Player Stats
                {secondPickTeam?.yourTeam && (
                  <span className="text-sm text-radiant ml-2">(Your Team - Manual List)</span>
                )}
              </h3>
              <div className="grid grid-cols-5 gap-4">
                {secondPickTeam?.playerIds.map((steamId, idx) => {
                  const stats = secondPickPlayerData.heroStatsMap.get(steamId) || [];
                  const player = secondPickPlayerData.players.get(steamId);
                  const manualList = secondPickTeam?.manualHeroLists?.[idx];
                  return (
                    <PlayerHeroListWithHighlight
                      key={steamId}
                      steamId={steamId}
                      player={player}
                      heroStats={stats}
                      heroes={heroes}
                      bannedHeroIds={bannedHeroIds}
                      pickedByThisTeam={secondPickPickedHeroIds}
                      pickedByOpponent={firstPickPickedHeroIds}
                      manualHeroList={manualList}
                    />
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
