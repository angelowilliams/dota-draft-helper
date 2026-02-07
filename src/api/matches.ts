import { opendotaFetch } from './opendota';
import { db } from '@/db/database';
import type { Match } from '@/types';

const COMPETITIVE_LOBBY_TYPES = [1, 2]; // Practice (1) + Tournament (2)
const MIN_PLAYERS_FOR_TEAM_MATCH = 3;

interface FetchTeamMatchesParams {
  teamId: number;
  playerIds?: string[];
  limit?: number;
}

interface OpenDotaTeamMatchResponse {
  match_id: number;
  start_time: number;
  radiant_win: boolean;
  radiant: boolean; // whether the queried team was radiant
  radiant_team_id: number;
  dire_team_id: number;
  league_name: string;
  leagueid: number;
  opposing_team_id: number;
  opposing_team_name: string;
}

interface OpenDotaPickBan {
  is_pick: boolean;
  hero_id: number;
  team: number; // 0 = radiant, 1 = dire
  order: number;
}

interface OpenDotaMatchDetailResponse {
  match_id: number;
  start_time: number;
  radiant_win: boolean;
  radiant_team_id: number;
  dire_team_id: number;
  radiant_name?: string;
  dire_name?: string;
  radiant_team?: { team_id: number; name: string };
  dire_team?: { team_id: number; name: string };
  league?: {
    name: string;
    leagueid: number;
  };
  picks_bans?: OpenDotaPickBan[];
  players?: Array<{ account_id: number; player_slot: number }>;
}

/**
 * Fetch full match details (including draft) for a single match.
 */
async function fetchMatchDetail(matchId: number): Promise<OpenDotaMatchDetailResponse | null> {
  try {
    return await opendotaFetch<OpenDotaMatchDetailResponse>(`/matches/${matchId}`);
  } catch (error) {
    console.error(`Failed to fetch match detail ${matchId}:`, error);
    return null;
  }
}

/**
 * Parse an OpenDota match detail response into our Match type.
 */
function parseMatchDetail(detail: OpenDotaMatchDetailResponse): Match {
  const radiantBans: number[] = [];
  const radiantPicks: number[] = [];
  const direBans: number[] = [];
  const direPicks: number[] = [];

  const pickBans = detail.picks_bans || [];
  const sortedPickBans = [...pickBans].sort((a, b) => a.order - b.order);

  for (const pb of sortedPickBans) {
    const isRadiant = pb.team === 0;
    if (isRadiant) {
      if (pb.is_pick) {
        radiantPicks.push(pb.hero_id);
      } else {
        radiantBans.push(pb.hero_id);
      }
    } else {
      if (pb.is_pick) {
        direPicks.push(pb.hero_id);
      } else {
        direBans.push(pb.hero_id);
      }
    }
  }

  return {
    matchId: detail.match_id.toString(),
    startDateTime: new Date(detail.start_time * 1000),
    didRadiantWin: detail.radiant_win,
    radiantTeamId: detail.radiant_team_id,
    direTeamId: detail.dire_team_id,
    radiantTeamName: detail.radiant_team?.name || detail.radiant_name,
    direTeamName: detail.dire_team?.name || detail.dire_name,
    radiantDraft: {
      bans: radiantBans,
      picks: radiantPicks,
    },
    direDraft: {
      bans: direBans,
      picks: direPicks,
    },
    pickBans: sortedPickBans.map((pb) => ({
      heroId: pb.hero_id,
      isPick: pb.is_pick,
      isRadiant: pb.team === 0,
      order: pb.order,
    })),
    leagueName: detail.league?.name,
    leagueId: detail.league?.leagueid,
  };
}

/**
 * Find competitive match IDs from cached player data in IndexedDB.
 * Returns match IDs where 3+ team players participated in the same
 * competitive match (lobbyType 1 or 2), sorted by most recent first.
 */
async function findCompetitiveMatchIdsFromPlayers(
  playerIds: string[],
  limit: number
): Promise<string[]> {
  // Get all competitive matches for these players from IndexedDB
  const allMatches = await db.playerMatches
    .where('steamId')
    .anyOf(playerIds)
    .and((m) => COMPETITIVE_LOBBY_TYPES.includes(m.lobbyType))
    .toArray();

  // Group by matchId and count how many team players were in each match
  const matchPlayerCounts = new Map<string, { count: number; startDateTime: number }>();
  for (const m of allMatches) {
    const existing = matchPlayerCounts.get(m.matchId);
    if (existing) {
      existing.count++;
    } else {
      matchPlayerCounts.set(m.matchId, { count: 1, startDateTime: m.startDateTime });
    }
  }

  // Keep matches with 3+ team players, sort by date descending
  return Array.from(matchPlayerCounts.entries())
    .filter(([, data]) => data.count >= MIN_PLAYERS_FOR_TEAM_MATCH)
    .sort((a, b) => b[1].startDateTime - a[1].startDateTime)
    .slice(0, limit)
    .map(([matchId]) => matchId);
}

/**
 * Fetch match details in batches of `concurrency` and return parsed Match objects.
 */
async function fetchMatchDetailsInBatches(
  matchIds: (string | number)[],
  concurrency = 3
): Promise<Match[]> {
  const matches: Match[] = [];
  for (let i = 0; i < matchIds.length; i += concurrency) {
    const batch = matchIds.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map((id) => fetchMatchDetail(Number(id)))
    );
    for (const detail of results) {
      if (detail) matches.push(parseMatchDetail(detail));
    }
  }
  return matches;
}

export async function fetchTeamMatches(
  params: FetchTeamMatchesParams
): Promise<Match[]> {
  const limit = params.limit || 10;

  try {
    // Try the team matches endpoint first
    const teamMatches = await opendotaFetch<OpenDotaTeamMatchResponse[]>(
      `/teams/${params.teamId}/matches`
    );

    if (teamMatches && teamMatches.length > 0) {
      const matchIds = teamMatches.slice(0, limit).map((m) => m.match_id);
      return fetchMatchDetailsInBatches(matchIds);
    }

    // Fallback: find competitive matches from cached player data
    if (params.playerIds && params.playerIds.length > 0) {
      const matchIds = await findCompetitiveMatchIdsFromPlayers(
        params.playerIds,
        limit
      );

      if (matchIds.length > 0) {
        return fetchMatchDetailsInBatches(matchIds);
      }
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch team matches:', error);
    throw error;
  }
}
