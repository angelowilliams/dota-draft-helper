import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  getMultiplePlayerMatches,
  savePlayers,
  getPlayer,
  bulkReplaceAllPlayerMatches,
} from '@/db/players';
import { fetchPlayerMatches } from '@/api/players';
import type { HeroStats, Player, LobbyTypeFilter, TimeWindowFilter, PlayerMatch } from '@/types';

// Lobby types considered "competitive" (tournament/league only)
const COMPETITIVE_LOBBY_TYPES = new Set([1, 2]);

interface UsePlayerDataParams {
  steamIds: string[];
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
  lobbyTypeFilter = 'all',
  timeWindowFilter = 'threeMonths',
}: UsePlayerDataParams): UsePlayerDataResult {
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load cached matches from IndexedDB
  const cachedMatches = useLiveQuery(async () => {
    if (steamIds.length === 0) return new Map<string, PlayerMatch[]>();
    return await getMultiplePlayerMatches(steamIds);
  }, [steamIds]);

  const cachedPlayers = useLiveQuery(async () => {
    if (steamIds.length === 0) return new Map<string, Player>();
    const players = new Map<string, Player>();
    for (const steamId of steamIds) {
      const player = await getPlayer(steamId);
      if (player) {
        players.set(steamId, player);
      }
    }
    return players;
  }, [steamIds]);

  // True while useLiveQuery is resolving from IndexedDB (before first result)
  const dbLoading = steamIds.length > 0 && cachedMatches === undefined;

  // Compute hero stats from cached matches, filtered by time window and lobby type
  const heroStatsMap = useMemo(() => {
    const result = new Map<string, HeroStats[]>();

    if (!cachedMatches) return result;

    for (const [steamId, matches] of cachedMatches.entries()) {
      const heroStats = aggregateMatchesToHeroStats(
        matches,
        steamId,
        lobbyTypeFilter,
        timeWindowFilter
      );
      result.set(steamId, heroStats);
    }

    return result;
  }, [cachedMatches, lobbyTypeFilter, timeWindowFilter]);

  const refetch = async () => {
    if (steamIds.length === 0) {
      setError('No Steam IDs provided');
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingProgress({ current: 0, total: steamIds.length, currentPlayer: null });

    try {
      // Fetch all players first, then write to DB in a single transaction.
      // This avoids a race condition where rapid sequential DB writes cause
      // useLiveQuery to re-run with incomplete subscription tracking,
      // resulting in some players' data appearing to disappear.
      const playersToSave: Player[] = [];
      const fetchedMatchesBySteamId = new Map<string, PlayerMatch[]>();

      for (let i = 0; i < steamIds.length; i++) {
        const steamId = steamIds[i];
        setLoadingProgress({ current: i, total: steamIds.length, currentPlayer: steamId });

        try {
          if (!steamId || steamId.trim().length === 0) {
            throw new Error('Invalid Steam ID');
          }

          const { player, matches, totalFetched } = await fetchPlayerMatches(steamId);
          console.log(`Fetched ${totalFetched} matches for ${steamId}`);

          fetchedMatchesBySteamId.set(steamId, matches);

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
          // Continue with other players even if one fails
          // Old data is preserved since we only replace successfully fetched players
        }
      }

      setLoadingProgress({ current: steamIds.length, total: steamIds.length, currentPlayer: null });

      // Write all fetched matches to DB in a single transaction
      if (fetchedMatchesBySteamId.size > 0) {
        await bulkReplaceAllPlayerMatches(fetchedMatchesBySteamId);
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

  return {
    heroStatsMap,
    players: cachedPlayers || new Map(),
    loading: loading || dbLoading,
    loadingProgress,
    error,
    refetch,
  };
}
