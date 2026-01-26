import { getStratzClient } from './stratz';
import type { Match } from '@/types';

interface FetchTeamMatchesParams {
  teamId: number;
  limit?: number;
}

export async function fetchTeamMatches(
  params: FetchTeamMatchesParams
): Promise<Match[]> {
  const client = getStratzClient();

  const query = `
    query GetTeamMatches($teamId: Int!, $take: Int!, $skip: Int!) {
      team(teamId: $teamId) {
        matches(request: { take: $take, skip: $skip }) {
          id
          startDateTime
          didRadiantWin
          radiantTeamId
          direTeamId
          league {
            id
            displayName
          }
          pickBans {
            heroId
            isPick
            isRadiant
            order
          }
        }
      }
    }
  `;

  try {
    const data: any = await client.request(query, {
      teamId: params.teamId,
      take: params.limit || 10,
      skip: 0,
    });

    if (!data.team || !data.team.matches) {
      return [];
    }

    const matches: Match[] = data.team.matches.map((match: any) => {
      // Separate picks and bans by team
      const radiantBans: number[] = [];
      const radiantPicks: number[] = [];
      const direBans: number[] = [];
      const direPicks: number[] = [];

      if (match.pickBans) {
        match.pickBans
          .sort((a: any, b: any) => a.order - b.order)
          .forEach((pb: any) => {
            if (pb.isRadiant) {
              if (pb.isPick) {
                radiantPicks.push(pb.heroId);
              } else {
                radiantBans.push(pb.heroId);
              }
            } else {
              if (pb.isPick) {
                direPicks.push(pb.heroId);
              } else {
                direBans.push(pb.heroId);
              }
            }
          });
      }

      return {
        matchId: match.id.toString(),
        startDateTime: new Date(match.startDateTime * 1000),
        didRadiantWin: match.didRadiantWin,
        radiantTeamId: match.radiantTeamId,
        direTeamId: match.direTeamId,
        radiantDraft: {
          bans: radiantBans,
          picks: radiantPicks,
        },
        direDraft: {
          bans: direBans,
          picks: direPicks,
        },
        pickBans: match.pickBans ? match.pickBans.map((pb: any) => ({
          heroId: pb.heroId,
          isPick: pb.isPick,
          isRadiant: pb.isRadiant,
          order: pb.order,
        })) : [],
        leagueName: match.league?.displayName,
        leagueId: match.league?.id,
      };
    });

    return matches;
  } catch (error) {
    console.error('Failed to fetch team matches:', error);
    throw error;
  }
}
