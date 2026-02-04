import { db } from './database';
import type { Player, HeroStats, LobbyTypeFilter } from '../types';

export async function savePlayer(player: Player): Promise<void> {
  await db.players.put({
    ...player,
    lastUpdated: new Date(),
  });
}

export async function savePlayers(players: Player[]): Promise<void> {
  await db.players.bulkPut(
    players.map(p => ({
      ...p,
      lastUpdated: new Date(),
    }))
  );
}

export async function getPlayer(steamId: string): Promise<Player | undefined> {
  return db.players.get(steamId);
}

export async function saveHeroStats(stats: HeroStats[]): Promise<void> {
  await db.heroStats.bulkPut(stats);
}

export async function getHeroStats(
  steamId: string,
  lobbyTypeFilter: LobbyTypeFilter = 'all'
): Promise<HeroStats[]> {
  return db.heroStats
    .where('[steamId+lobbyTypeFilter]')
    .equals([steamId, lobbyTypeFilter])
    .toArray();
}

export async function getMultipleHeroStats(
  steamIds: string[],
  lobbyTypeFilter: LobbyTypeFilter = 'all'
): Promise<Map<string, HeroStats[]>> {
  const results = new Map<string, HeroStats[]>();

  for (const steamId of steamIds) {
    const stats = await getHeroStats(steamId, lobbyTypeFilter);
    results.set(steamId, stats);
  }

  return results;
}

export async function deletePlayerData(steamId: string): Promise<void> {
  await db.players.delete(steamId);
  await db.heroStats.where('steamId').equals(steamId).delete();
}

export async function clearAllHeroStats(
  steamIds: string[],
  lobbyTypeFilter?: LobbyTypeFilter
): Promise<void> {
  for (const steamId of steamIds) {
    if (lobbyTypeFilter) {
      // Clear only stats for specific filter
      await db.heroStats
        .where('[steamId+lobbyTypeFilter]')
        .equals([steamId, lobbyTypeFilter])
        .delete();
    } else {
      // Clear all stats for this player (all filters)
      await db.heroStats.where('steamId').equals(steamId).delete();
    }
  }
}
