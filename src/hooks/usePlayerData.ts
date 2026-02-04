import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getMultipleHeroStats, saveHeroStats, clearAllHeroStats, savePlayers, getPlayer } from '@/db/players';
import { fetchPlayerHeroes } from '@/api/players';
import type { HeroStats, Player, LobbyTypeFilter } from '@/types';

interface UsePlayerDataParams {
  steamIds: string[];
  autoFetch?: boolean;
  lobbyTypeFilter?: LobbyTypeFilter;
}

interface UsePlayerDataResult {
  heroStatsMap: Map<string, HeroStats[]>;
  players: Map<string, Player>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePlayerData({
  steamIds,
  autoFetch = false,
  lobbyTypeFilter = 'all',
}: UsePlayerDataParams): UsePlayerDataResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cached data from IndexedDB
  const cachedStats = useLiveQuery(async () => {
    if (steamIds.length === 0) return new Map();
    return await getMultipleHeroStats(steamIds, lobbyTypeFilter);
  }, [steamIds, lobbyTypeFilter]);

  const cachedPlayers = useLiveQuery(async () => {
    if (steamIds.length === 0) return new Map();
    const players = new Map<string, Player>();
    for (const steamId of steamIds) {
      const player = await getPlayer(steamId);
      if (player) {
        players.set(steamId, player);
      }
    }
    return players;
  }, [steamIds]);

  const refetch = async () => {
    if (steamIds.length === 0) {
      setError('No Steam IDs provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Clear existing stats for these players with current filter
      await clearAllHeroStats(steamIds, lobbyTypeFilter);

      // Fetch new data from STRATZ (now includes player info)
      const results = await Promise.all(
        steamIds.map(async (steamId) => {
          try {
            // Validate Steam ID
            if (!steamId || steamId.trim().length === 0) {
              throw new Error('Invalid Steam ID');
            }

            const { player, heroStats } = await fetchPlayerHeroes({
              steamId,
              lobbyTypeFilter,
            });
            return { steamId, player, heroStats };
          } catch (error) {
            console.error(`Failed to fetch data for ${steamId}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            // Return empty data but log the specific error
            return { steamId, player: null, heroStats: [], error: errorMessage };
          }
        })
      );

      // Save players and stats to IndexedDB
      const playersToSave: Player[] = [];
      const allStats: HeroStats[] = [];

      results.forEach(({ steamId, player, heroStats }) => {
        if (player) {
          // Prefer pro name over regular Steam name
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
        allStats.push(...heroStats);
      });

      if (playersToSave.length > 0) {
        await savePlayers(playersToSave);
      }

      if (allStats.length > 0) {
        await saveHeroStats(allStats);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch player data';
      setError(message);
      console.error('Error fetching player data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount if enabled and no cached data
  useEffect(() => {
    if (autoFetch && cachedStats && cachedStats.size === 0 && steamIds.length > 0) {
      refetch();
    }
  }, [autoFetch, steamIds.length, lobbyTypeFilter]);

  return {
    heroStatsMap: cachedStats || new Map(),
    players: cachedPlayers || new Map(),
    loading,
    error,
    refetch,
  };
}
