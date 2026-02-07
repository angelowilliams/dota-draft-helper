import { opendotaFetch } from './opendota';
import type { Match } from '@/types';

interface FetchTeamMatchesParams {
  teamId: number;
  limit?: number;
}

interface OpenDotaTeamMatchResponse {
  match_id: number;
  start_time: number;
  radiant_win: boolean;
  radiant_team_id: number;
  dire_team_id: number;
  league_name: string;
  leagueid: number;
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
  league?: {
    name: string;
    leagueid: number;
  };
  picks_bans?: OpenDotaPickBan[];
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

export async function fetchTeamMatches(
  params: FetchTeamMatchesParams
): Promise<Match[]> {
  const limit = params.limit || 10;

  try {
    // Fetch team match list (no draft data)
    const teamMatches = await opendotaFetch<OpenDotaTeamMatchResponse[]>(
      `/teams/${params.teamId}/matches`
    );

    if (!teamMatches || teamMatches.length === 0) {
      return [];
    }

    // Take only the requested number of matches
    const matchesToFetch = teamMatches.slice(0, limit);

    // Fetch full details (with draft) for each match
    const matches: Match[] = [];

    for (const teamMatch of matchesToFetch) {
      const detail = await fetchMatchDetail(teamMatch.match_id);
      if (!detail) continue;

      // Parse pick/ban data
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

      matches.push({
        matchId: detail.match_id.toString(),
        startDateTime: new Date(detail.start_time * 1000),
        didRadiantWin: detail.radiant_win,
        radiantTeamId: detail.radiant_team_id,
        direTeamId: detail.dire_team_id,
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
      });
    }

    return matches;
  } catch (error) {
    console.error('Failed to fetch team matches:', error);
    throw error;
  }
}
