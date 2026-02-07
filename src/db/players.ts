import { db } from './database';
import type { Player, PlayerMatch } from '../types';

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

export async function deletePlayerData(steamId: string): Promise<void> {
  await db.players.delete(steamId);
  await db.playerMatches.where('steamId').equals(steamId).delete();
}

// Player Matches operations
export async function savePlayerMatches(matches: PlayerMatch[]): Promise<void> {
  await db.playerMatches.bulkPut(matches);
}

export async function getPlayerMatches(steamId: string): Promise<PlayerMatch[]> {
  return db.playerMatches.where('steamId').equals(steamId).toArray();
}

export async function getMultiplePlayerMatches(
  steamIds: string[]
): Promise<Map<string, PlayerMatch[]>> {
  const results = new Map<string, PlayerMatch[]>();

  for (const steamId of steamIds) {
    const matches = await getPlayerMatches(steamId);
    results.set(steamId, matches);
  }

  return results;
}

export async function hasPlayerMatches(steamId: string): Promise<boolean> {
  const count = await db.playerMatches.where('steamId').equals(steamId).count();
  return count > 0;
}

export async function hasAnyPlayerMatches(steamIds: string[]): Promise<boolean> {
  for (const steamId of steamIds) {
    if (await hasPlayerMatches(steamId)) {
      return true;
    }
  }
  return false;
}

export async function clearPlayerMatches(steamIds: string[]): Promise<void> {
  for (const steamId of steamIds) {
    await db.playerMatches.where('steamId').equals(steamId).delete();
  }
}

/**
 * Atomically clear old matches and save new ones for multiple players
 * in a single transaction. This prevents useLiveQuery from seeing
 * intermediate states (e.g., cleared but not yet re-saved).
 */
export async function bulkReplaceAllPlayerMatches(
  matchesBySteamId: Map<string, PlayerMatch[]>
): Promise<void> {
  await db.transaction('rw', db.playerMatches, async () => {
    for (const [steamId, matches] of matchesBySteamId.entries()) {
      await db.playerMatches.where('steamId').equals(steamId).delete();
      if (matches.length > 0) {
        await db.playerMatches.bulkPut(matches);
      }
    }
  });
}
