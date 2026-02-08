import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  getMultiplePlayerMatches,
  savePlayers,
  savePlayerMatches,
  getPlayer,
  getLatestMatchTime,
} from '@/db/players';
import { fetchPlayerMatches } from '@/api/players';
import type { HeroStats, Player, LobbyTypeFilter, TimeWindowFilter, PlayerMatch } from '@/types';

// Lobby types considered "competitive" (tournament/league only)
const COMPETITIVE_LOBBY_TYPES = new Set([1, 2]);

interface UsePlayerDataParams {
  steamIds: string[];
  altAccountMap?: Record<string, string[]>;
  lobbyTypeFilter?: LobbyTypeFilter;
  timeWindowFilter?: TimeWindowFilter;
}

interface LoadingProgress {
  current: number;
  total: number;
  currentPlayer: string | null;
}

interface UsePlayerDataResult {
  heroStatsMap: Map<string, HeroStats[]>;
  players: Map<string, Player>;
  loading: boolean;
  loadingProgress: LoadingProgress | null;
  error: string | null;
  lastFetched: Date | null;
  refetch: () => Promise<void>;
}

// Get the start timestamp (in seconds) for a given time window
function getTimeWindowStart(timeWindow: TimeWindowFilter): number {
  const now = Math.floor(Date.now() / 1000);
  switch (timeWindow) {
    case 'month':
      return now - 30 * 24 * 60 * 60;
    case 'threeMonths':
      return now - 90 * 24 * 60 * 60;
    case 'year':
      return now - 365 * 24 * 60 * 60;
  }
}

// Aggregate matches into hero stats, filtered by time window and lobby type
function aggregateMatchesToHeroStats(
  matches: PlayerMatch[],
  steamId: string,
  lobbyTypeFilter: LobbyTypeFilter,
  timeWindowFilter: TimeWindowFilter
): HeroStats[] {
  const timeWindowStart = getTimeWindowStart(timeWindowFilter);
  const heroMap = new Map<number, { games: number; wins: number }>();

  for (const match of matches) {
    if (match.startDateTime < timeWindowStart) continue;
    if (lobbyTypeFilter === 'competitive' && !COMPETITIVE_LOBBY_TYPES.has(match.lobbyType)) continue;

    let stats = heroMap.get(match.heroId);
    if (!stats) {
      stats = { games: 0, wins: 0 };
      heroMap.set(match.heroId, stats);
    }

    stats.games++;
    if (match.isWin) stats.wins++;
  }

  return Array.from(heroMap.entries())
    .map(([heroId, stats]) => ({
      steamId,
      heroId,
      games: stats.games,
      wins: stats.wins,
      avgImp: 0,
    }))
    .filter((stat) => stat.games > 0);
}

export function usePlayerData({
  steamIds,
  altAccountMap,
  lobbyTypeFilter = 'all',
  timeWindowFilter = 'threeMonths',
}: UsePlayerDataParams): UsePlayerDataResult {
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Collect all Steam IDs (main + alts) for fetching and caching
  const allSteamIds = useMemo(() => {
    if (!altAccountMap) return steamIds;
    const all = new Set(steamIds);
    for (const alts of Object.values(altAccountMap)) {
      for (const alt of alts) all.add(alt);
    }
    return Array.from(all);
  }, [steamIds, altAccountMap]);

  // Load cached matches from IndexedDB
  const cachedMatches = useLiveQuery(async () => {
    if (allSteamIds.length === 0) return new Map<string, PlayerMatch[]>();
    return await getMultiplePlayerMatches(allSteamIds);
  }, [allSteamIds]);

  const cachedPlayers = useLiveQuery(async () => {
    if (allSteamIds.length === 0) return new Map<string, Player>();
    const players = new Map<string, Player>();
    for (const steamId of allSteamIds) {
      const player = await getPlayer(steamId);
      if (player) {
        players.set(steamId, player);
      }
    }
    return players;
  }, [allSteamIds]);

  // True while useLiveQuery is resolving from IndexedDB (before first result)
  const dbLoading = steamIds.length > 0 && cachedMatches === undefined;

  // Compute hero stats from cached matches, merging alt account matches into main player
  const heroStatsMap = useMemo(() => {
    const result = new Map<string, HeroStats[]>();
    if (!cachedMatches) return result;

    for (const mainId of steamIds) {
      const allMatches: PlayerMatch[] = [];
      const mainMatches = cachedMatches.get(mainId);
      if (mainMatches) allMatches.push(...mainMatches);

      const altIds = altAccountMap?.[mainId];
      if (altIds) {
        for (const altId of altIds) {
          const altMatches = cachedMatches.get(altId);
          if (altMatches) allMatches.push(...altMatches);
        }
      }

      const heroStats = aggregateMatchesToHeroStats(
        allMatches,
        mainId,
        lobbyTypeFilter,
        timeWindowFilter
      );
      result.set(mainId, heroStats);
    }

    return result;
  }, [cachedMatches, steamIds, altAccountMap, lobbyTypeFilter, timeWindowFilter]);

  const refetch = async () => {
    if (steamIds.length === 0) {
      setError('No Steam IDs provided');
      return;
    }

    setLoading(true);
    setError(null);

    // Build flat list of all accounts to fetch (main + alts)
    const accountsToFetch: { steamId: string; playerIndex: number }[] = [];
    for (let i = 0; i < steamIds.length; i++) {
      accountsToFetch.push({ steamId: steamIds[i], playerIndex: i });
      const altIds = altAccountMap?.[steamIds[i]];
      if (altIds) {
        for (const altId of altIds) {
          accountsToFetch.push({ steamId: altId, playerIndex: i });
        }
      }
    }

    setLoadingProgress({ current: 0, total: steamIds.length, currentPlayer: null });

    try {
      const playersToSave: Player[] = [];
      const allNewMatches: PlayerMatch[] = [];
      let lastPlayerIndex = -1;

      for (let i = 0; i < accountsToFetch.length; i++) {
        const { steamId, playerIndex } = accountsToFetch[i];

        if (playerIndex !== lastPlayerIndex) {
          setLoadingProgress({
            current: playerIndex,
            total: steamIds.length,
            currentPlayer: steamIds[playerIndex],
          });
          lastPlayerIndex = playerIndex;
        }

        try {
          if (!steamId || steamId.trim().length === 0) {
            throw new Error('Invalid Steam ID');
          }

          const latestMatchTime = await getLatestMatchTime(steamId) ?? undefined;

          const { player, matches, totalFetched } = await fetchPlayerMatches(
            steamId,
            latestMatchTime ? { latestMatchTime } : undefined,
          );
          console.log(
            `Fetched ${totalFetched} new matches for ${steamId}` +
            (latestMatchTime ? ` (incremental since ${new Date(latestMatchTime * 1000).toLocaleDateString()})` : ' (full)')
          );

          allNewMatches.push(...matches);

          if (player?.profile) {
            const playerName =
              player.profile.name ||
              player.profile.personaname ||
              `Player ${steamId}`;

            playersToSave.push({
              steamId,
              name: playerName,
              avatarUrl: player.profile.avatarfull,
            });
          }
        } catch (error) {
          console.error(`Failed to fetch data for ${steamId}:`, error);
        }
      }

      setLoadingProgress({ current: steamIds.length, total: steamIds.length, currentPlayer: null });

      if (allNewMatches.length > 0) {
        await savePlayerMatches(allNewMatches);
      }

      if (playersToSave.length > 0) {
        await savePlayers(playersToSave);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch player data';
      setError(message);
      console.error('Error fetching player data:', err);
    } finally {
      setLoading(false);
      setLoadingProgress(null);
    }
  };

  // Derive last fetched time from the most recent player lastUpdated
  const lastFetched = useMemo(() => {
    if (!cachedPlayers || cachedPlayers.size === 0) return null;
    let latest: Date | null = null;
    for (const player of cachedPlayers.values()) {
      if (player.lastUpdated && (!latest || player.lastUpdated > latest)) {
        latest = player.lastUpdated;
      }
    }
    return latest;
  }, [cachedPlayers]);

  return {
    heroStatsMap,
    players: cachedPlayers || new Map(),
    loading: loading || dbLoading,
    loadingProgress,
    error,
    lastFetched,
    refetch,
  };
}
