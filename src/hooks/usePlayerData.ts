import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  getMultiplePlayerMatches,
  savePlayerMatches,
  clearPlayerMatches,
  savePlayers,
  getPlayer,
} from '@/db/players';
import { fetchPlayerMatches } from '@/api/players';
import type { HeroStats, Player, LobbyTypeFilter, TimeWindowFilter, PlayerMatch } from '@/types';

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

// Aggregate matches into hero stats
function aggregateMatchesToHeroStats(
  matches: PlayerMatch[],
  steamId: string,
  lobbyTypeFilter: LobbyTypeFilter,
  timeWindowFilter: TimeWindowFilter
): HeroStats[] {
  const timeWindowStart = getTimeWindowStart(timeWindowFilter);

  // Filter matches by time window
  const filteredMatches = matches.filter((m) => m.startDateTime >= timeWindowStart);

  // Aggregate by hero
  const heroStatsMap = new Map<
    number,
    {
      pubGames: number;
      compGames: number;
      wins: number;
      impSum: number;
      impCount: number;
    }
  >();

  for (const match of filteredMatches) {
    // Filter by lobby type if needed
    if (lobbyTypeFilter === 'competitive' && match.lobbyType !== 1) {
      continue;
    }

    let stats = heroStatsMap.get(match.heroId);
    if (!stats) {
      stats = { pubGames: 0, compGames: 0, wins: 0, impSum: 0, impCount: 0 };
      heroStatsMap.set(match.heroId, stats);
    }

    // lobbyType 1 = competitive (tournament/league)
    if (match.lobbyType === 1) {
      stats.compGames++;
    } else {
      stats.pubGames++;
    }

    if (match.isWin) {
      stats.wins++;
    }

    if (match.imp !== null) {
      stats.impSum += match.imp;
      stats.impCount++;
    }
  }

  // Convert to HeroStats array
  return Array.from(heroStatsMap.entries())
    .map(([heroId, stats]) => ({
      steamId,
      heroId,
      lobbyTypeFilter,
      pubGames: stats.pubGames,
      competitiveGames: stats.compGames,
      wins: stats.wins,
      avgImp: stats.impCount > 0 ? stats.impSum / stats.impCount : 0,
      lastPlayed: new Date(),
    }))
    .filter((stat) => stat.pubGames > 0 || stat.competitiveGames > 0);
}

export function usePlayerData({
  steamIds,
  lobbyTypeFilter = 'all',
  timeWindowFilter = 'year',
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
      // Clear existing matches for these players
      await clearPlayerMatches(steamIds);

      // Fetch players sequentially to show progress and help rate limiting
      const playersToSave: Player[] = [];
      const allMatches: PlayerMatch[] = [];

      for (let i = 0; i < steamIds.length; i++) {
        const steamId = steamIds[i];
        setLoadingProgress({ current: i, total: steamIds.length, currentPlayer: steamId });

        try {
          if (!steamId || steamId.trim().length === 0) {
            throw new Error('Invalid Steam ID');
          }

          const { player, matches, totalFetched } = await fetchPlayerMatches(steamId);
          console.log(`Fetched ${totalFetched} matches for ${steamId}`);

          if (player) {
            const playerName =
              player.steamAccount.proSteamAccount?.name ||
              player.steamAccount.name ||
              `Player ${steamId}`;

            playersToSave.push({
              steamId,
              name: playerName,
              avatarUrl: player.steamAccount.avatar,
            });
          }
          allMatches.push(...matches);
        } catch (error) {
          console.error(`Failed to fetch data for ${steamId}:`, error);
          // Continue with other players even if one fails
        }
      }

      setLoadingProgress({ current: steamIds.length, total: steamIds.length, currentPlayer: null });

      if (playersToSave.length > 0) {
        await savePlayers(playersToSave);
      }

      if (allMatches.length > 0) {
        await savePlayerMatches(allMatches);
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
    loading,
    loadingProgress,
    error,
    refetch,
  };
}
