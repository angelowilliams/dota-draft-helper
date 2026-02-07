import { useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import { useTeams } from '@/hooks/useTeams';
import { useHeroes } from '@/hooks/useHeroes';
import { usePlayerData } from '@/hooks/usePlayerData';
import { useDraft } from '@/contexts/DraftContext';
import { LobbyTypeToggle } from './ui/LobbyTypeToggle';
import { HeroSearchInput } from './ui/HeroSearchInput';
import { CAPTAIN_MODE_DRAFT_ORDER } from '@/config/draftOrder';
import { getHeroPortraitUrl } from '@/config/heroes';
import { getTeamActions } from '@/services/draft';
import type { Hero, HeroStats, Player } from '@/types';

interface PlayerHeroListWithHighlightProps {
  steamId: string;
  player?: Player;
  heroStats: HeroStats[];
  heroes: Hero[];
  bannedHeroIds: Set<number>;
  pickedByThisTeam: Set<number>;
  pickedByOpponent: Set<number>;
  manualHeroList?: number[];
  searchFilter?: string;
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
  searchFilter = '',
}: PlayerHeroListWithHighlightProps) {
  const sortedHeroes = useMemo(() => {
    if (!heroes || !Array.isArray(heroes)) {
      return [];
    }

    const defaultStat = (heroId: number): HeroStats => ({
      steamId, heroId, games: 0, wins: 0, avgImp: 0,
    });

    let items;

    if (manualHeroList && Array.isArray(manualHeroList) && manualHeroList.length > 0) {
      items = manualHeroList
        .map((heroId) => {
          const hero = heroes.find((h) => h.id === heroId);
          if (!hero) return null;
          const stat = heroStats?.find((s) => s.heroId === heroId);
          return { hero, stat: stat || defaultStat(heroId) };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
    } else {
      if (!heroStats || !Array.isArray(heroStats)) return [];

      items = heroStats
        .map((stat) => {
          if (!stat || typeof stat.heroId !== 'number') return null;
          const hero = heroes.find((h) => h.id === stat.heroId);
          if (!hero) return null;
          return { hero, stat };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => b.stat.games - a.stat.games);
    }

    if (searchFilter && searchFilter.trim().length > 0) {
      const lowerSearch = searchFilter.toLowerCase();
      items = items.filter((item) =>
        item.hero.displayName.toLowerCase().startsWith(lowerSearch) ||
        item.hero.name.toLowerCase().startsWith(lowerSearch)
      );
    }

    return items;
  }, [heroStats, heroes, manualHeroList, steamId, searchFilter]);

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="text-base font-semibold">
          <a
            href={`https://www.opendota.com/players/${steamId}`}
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
          <div className="flex items-center gap-2 pb-2 border-b border-dota-bg-tertiary text-xs font-medium text-dota-text-muted">
            <div className="flex-shrink-0" style={{ width: '48px' }} />
            <div className="flex-1 grid grid-cols-2 gap-2 text-center">
              <div>Games</div>
              <div>Win%</div>
            </div>
          </div>

          <div className="space-y-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: '580px' }}>
            {sortedHeroes.map(({ hero, stat }) => {
              const isBanned = bannedHeroIds.has(hero.id);
              const isPickedByThisTeam = pickedByThisTeam.has(hero.id);
              const isPickedByOpponent = pickedByOpponent.has(hero.id);

              let bgClass = 'hover:bg-dota-bg-tertiary';
              let borderClass = '';
              let imgClass = 'rounded flex-shrink-0';

              if (isBanned || isPickedByOpponent) {
                bgClass = 'bg-red-900 bg-opacity-20';
                imgClass = 'rounded flex-shrink-0 grayscale opacity-60';
              } else if (isPickedByThisTeam) {
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
                  <div className="flex-1 grid grid-cols-2 gap-2 text-xs text-center">
                    <div className="font-medium text-dota-text-primary">{stat.games}</div>
                    <div className="text-dota-text-secondary">
                      {stat.games > 0
                        ? `${Math.round((stat.wins / stat.games) * 100)}%`
                        : '-'}
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

export function DraftAssistantView() {
  const { teams: allTeams } = useTeams();
  const { heroes } = useHeroes();

  const {
    firstPickTeamId,
    secondPickTeamId,
    draftState,
    selectedCell,
    searchQuery,
    firstPickSearchQuery,
    secondPickSearchQuery,
    lobbyTypeFilter,
    analysis,
    setFirstPickTeamId,
    setSecondPickTeamId,
    selectCell,
    selectHero,
    resetDraft,
    resetTeams,
    setSearchQuery,
    setFirstPickSearchQuery,
    setSecondPickSearchQuery,
    setLobbyTypeFilter,
  } = useDraft();

  const teams = useMemo(() => {
    return [...allTeams].sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return 0;
    });
  }, [allTeams]);

  const firstPickTeam = teams.find(t => t.id === firstPickTeamId);
  const secondPickTeam = teams.find(t => t.id === secondPickTeamId);

  const firstPickPlayerData = usePlayerData({
    steamIds: firstPickTeam?.playerIds || [],
    lobbyTypeFilter,
  });

  const secondPickPlayerData = usePlayerData({
    steamIds: secondPickTeam?.playerIds || [],
    lobbyTypeFilter,
  });

  const selectedHeroIds = new Set(Array.from(draftState.values()));

  const filteredHeroes = heroes.filter(hero => {
    if (selectedHeroIds.has(hero.id)) return false;
    if (searchQuery) {
      const lowerSearch = searchQuery.toLowerCase();
      return hero.displayName.toLowerCase().startsWith(lowerSearch) ||
             hero.name.toLowerCase().startsWith(lowerSearch);
    }
    return true;
  });

  const handleCellClick = (order: number) => {
    selectCell(order);
  };

  const handleHeroSelect = (heroId: number) => {
    selectHero(heroId);
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
                onChange={(e) => setFirstPickTeamId(e.target.value)}
                className="input-field w-full"
              >
                <option value="">Select a team...</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id} disabled={team.id === secondPickTeamId}>
                    {team.name}
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
                onChange={(e) => setSecondPickTeamId(e.target.value)}
                className="input-field w-full"
              >
                <option value="">Select a team...</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id} disabled={team.id === firstPickTeamId}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Game Type Filter
              </label>
              <LobbyTypeToggle value={lobbyTypeFilter} onChange={setLobbyTypeFilter} />
            </div>

            {firstPickTeamId && secondPickTeamId && (
              <button
                onClick={() => {
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

  // Build draft actions using service
  const firstPickActions = getTeamActions(draftState, 'firstPick');
  const secondPickActions = getTeamActions(draftState, 'secondPick');

  const { bannedHeroIds, firstPickPickedHeroIds, secondPickPickedHeroIds } = analysis;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Draft Assistant</h2>
        <div className="flex gap-2">
          <button
            onClick={resetDraft}
            className="btn-primary flex items-center gap-2"
          >
            <RotateCcw size={18} />
            Reset Draft
          </button>
          <button
            onClick={resetTeams}
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
              onChange={(e) => setSearchQuery(e.target.value)}
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
        {/* First Pick Team Stats */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {firstPickTeam?.name} Player Stats
              {firstPickTeam?.manualHeroLists?.some(l => l.length > 0) && (
                <span className="text-sm text-radiant ml-2">(Hero list override)</span>
              )}
            </h3>
            <HeroSearchInput
              value={firstPickSearchQuery}
              onChange={setFirstPickSearchQuery}
            />
          </div>
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
                  searchFilter={firstPickSearchQuery}
                />
              );
            })}
          </div>
        </div>

        {/* Second Pick Team Stats */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {secondPickTeam?.name} Player Stats
              {secondPickTeam?.manualHeroLists?.some(l => l.length > 0) && (
                <span className="text-sm text-radiant ml-2">(Hero list override)</span>
              )}
            </h3>
            <HeroSearchInput
              value={secondPickSearchQuery}
              onChange={setSecondPickSearchQuery}
            />
          </div>
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
                  searchFilter={secondPickSearchQuery}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
