import { opendotaFetch, normalizeToSteam32 } from './opendota';
import type { OpenDotaPlayer, PlayerMatch } from '@/types';

/**
 * Minimal match info from the player matches endpoint (for team detection).
 */
export interface PlayerMatchSummary {
  match_id: number;
  player_slot: number;
}

/**
 * Fetch recent practice lobby matches for a player (lobby_type=1).
 * Used as a fallback for team detection via match details.
 */
export async function fetchPlayerRecentLobbyMatches(
  steam32Id: string,
  limit = 5
): Promise<PlayerMatchSummary[]> {
  return opendotaFetch<PlayerMatchSummary[]>(
    `/players/${steam32Id}/matches?limit=${limit}&lobby_type=1`
  );
}

const MAX_MATCHES = 500;
const BATCH_SIZE = 100; // OpenDota API limit per request

// Valid game modes (exclude Turbo = 23)
const VALID_GAME_MODES = [1, 2, 3, 4, 5, 10, 16, 22];

interface FetchPlayerMatchesResult {
  player: OpenDotaPlayer;
  matches: PlayerMatch[];
  totalFetched: number;
}

/**
 * Fetch player profile info from OpenDota.
 */
async function fetchPlayerProfile(steam32Id: string): Promise<OpenDotaPlayer> {
  return opendotaFetch<OpenDotaPlayer>(`/players/${steam32Id}`);
}

/**
 * OpenDota match response shape (subset of fields we use).
 */
interface OpenDotaMatchResponse {
  match_id: number;
  player_slot: number;
  radiant_win: boolean;
  hero_id: number;
  start_time: number;
  lobby_type: number;
  game_mode: number;
}

interface FetchPlayerMatchesOptions {
  /** If set, stop fetching once we hit matches at or before this unix timestamp. */
  latestMatchTime?: number;
}

/**
 * Fetches up to MAX_MATCHES (500) games from the past year for a player.
 * Uses offset-based pagination. When latestMatchTime is provided, stops
 * early once it reaches matches already stored locally.
 */
export async function fetchPlayerMatches(
  steamId: string,
  options?: FetchPlayerMatchesOptions
): Promise<FetchPlayerMatchesResult> {
  const steam32Id = String(normalizeToSteam32(steamId));

  // Fetch player profile
  const player = await fetchPlayerProfile(steam32Id);

  if (!player || !player.profile) {
    throw new Error(`Player not found: ${steamId}`);
  }

  const allMatches: PlayerMatch[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore && allMatches.length < MAX_MATCHES) {
    try {
      const matches = await opendotaFetch<OpenDotaMatchResponse[]>(
        `/players/${steam32Id}/matches?limit=${BATCH_SIZE}&offset=${offset}&date=365&significant=0`
      );

      if (!matches || matches.length === 0) {
        hasMore = false;
        break;
      }

      for (const match of matches) {
        if (allMatches.length >= MAX_MATCHES) break;

        // Stop if we've reached matches we already have
        if (options?.latestMatchTime && match.start_time <= options.latestMatchTime) {
          hasMore = false;
          break;
        }

        // Filter out invalid game modes (Turbo etc.)
        if (!VALID_GAME_MODES.includes(match.game_mode)) continue;

        // player_slot < 128 means radiant side
        const isRadiant = match.player_slot < 128;
        const didWin = isRadiant === match.radiant_win;

        allMatches.push({
          matchId: String(match.match_id),
          steamId,
          heroId: match.hero_id,
          isWin: didWin,
          imp: null, // Not available in OpenDota
          lobbyType: match.lobby_type ?? 0,
          startDateTime: match.start_time,
        });
      }

      offset += BATCH_SIZE;

      if (matches.length < BATCH_SIZE) {
        hasMore = false;
      }
    } catch (error) {
      console.error(`Failed to fetch matches for ${steamId} at offset=${offset}:`, error);
      throw error;
    }
  }

  return {
    player,
    matches: allMatches,
    totalFetched: allMatches.length,
  };
}
