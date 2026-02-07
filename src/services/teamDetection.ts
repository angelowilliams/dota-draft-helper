import { fetchPlayerRecentLobbyMatches } from '@/api/players';
import { fetchTeamInfo } from '@/api/teams';
import { opendotaFetch } from '@/api/opendota';

export interface CandidateTeam {
  teamId: number;
  name: string;
  tag: string;
  logoUrl: string;
  matchingPlayers: number;
}

export interface TeamDetectionResult {
  candidates: CandidateTeam[];
  status: 'found' | 'none' | 'error';
  errorMessage?: string;
}

interface MatchDetailForDetection {
  match_id: number;
  radiant_team_id?: number;
  dire_team_id?: number;
  radiant_team?: { team_id: number; name: string; tag: string; logo_url: string };
  dire_team?: { team_id: number; name: string; tag: string; logo_url: string };
  radiant_name?: string;
  dire_name?: string;
  players?: Array<{ account_id: number; player_slot: number }>;
}

/**
 * Detect teams from recent practice lobby match details.
 * For each player, fetches recent lobby matches (lobby_type=1), then fetches
 * match details to extract team IDs. Returns candidates with 2+ matching players.
 */
async function detectFromMatches(
  playerIds: string[]
): Promise<CandidateTeam[]> {
  // team_id -> { name, tag, logoUrl, playerSet }
  const teamPlayerMap = new Map<
    number,
    { name: string; tag: string; logoUrl: string; players: Set<string> }
  >();

  for (const playerId of playerIds) {
    try {
      const matches = await fetchPlayerRecentLobbyMatches(playerId, 5);
      if (!matches || matches.length === 0) continue;

      // Fetch details for up to 2 matches
      const matchesToCheck = matches.slice(0, 2);
      for (const match of matchesToCheck) {
        try {
          const detail = await opendotaFetch<MatchDetailForDetection>(
            `/matches/${match.match_id}`
          );
          if (!detail) continue;

          // Determine which side this player was on
          const playerEntry = detail.players?.find(
            (p) => p.account_id === Number(playerId)
          );
          const isRadiant = playerEntry
            ? playerEntry.player_slot < 128
            : match.player_slot < 128;

          const teamObj = isRadiant ? detail.radiant_team : detail.dire_team;
          const teamId = isRadiant
            ? detail.radiant_team_id
            : detail.dire_team_id;
          // Amateur practice lobbies use radiant_name/dire_name instead of team objects
          const teamName = teamObj?.name
            || (isRadiant ? detail.radiant_name : detail.dire_name)
            || 'Unknown Team';

          if (teamId) {
            const existing = teamPlayerMap.get(teamId);
            if (existing) {
              existing.players.add(playerId);
              // Update name if we found a better one
              if (existing.name === 'Unknown Team' && teamName !== 'Unknown Team') {
                existing.name = teamName;
              }
            } else {
              teamPlayerMap.set(teamId, {
                name: teamName,
                tag: teamObj?.tag || '',
                logoUrl: teamObj?.logo_url || '',
                players: new Set([playerId]),
              });
            }
          }
        } catch {
          // Individual match detail failure is non-critical
        }
      }
    } catch {
      // Individual player match fetch failure is non-critical
    }
  }

  const candidates: CandidateTeam[] = [];
  for (const [teamId, data] of teamPlayerMap) {
    if (data.players.size < 2) continue;

    // Fetch full team info to get name, tag, and logo
    let { name, tag, logoUrl } = data;
    try {
      const teamInfo = await fetchTeamInfo(teamId);
      if (teamInfo) {
        name = teamInfo.name || name;
        tag = teamInfo.tag || tag;
        logoUrl = teamInfo.logo || logoUrl;
      }
    } catch {
      // Non-critical, fall back to match data
    }

    candidates.push({
      teamId,
      name,
      tag,
      logoUrl,
      matchingPlayers: data.players.size,
    });
  }

  return candidates.sort((a, b) => b.matchingPlayers - a.matchingPlayers);
}

/**
 * Detect OpenDota team ID for a set of player IDs by analyzing their
 * recent practice lobby matches.
 *
 * Fetches recent lobby matches per player, then fetches match details
 * to extract team IDs. Returns candidates sorted by matching player count.
 * Only includes teams with 2+ matching players.
 */
export async function detectTeamsForPlayers(
  playerIds: string[]
): Promise<TeamDetectionResult> {
  if (!playerIds || playerIds.length === 0) {
    return { candidates: [], status: 'none' };
  }

  try {
    const candidates = await detectFromMatches(playerIds);
    if (candidates.length > 0) {
      return { candidates, status: 'found' };
    }

    return { candidates: [], status: 'none' };
  } catch (error) {
    console.error('Team detection failed:', error);
    return {
      candidates: [],
      status: 'error',
      errorMessage:
        error instanceof Error ? error.message : 'Team detection failed',
    };
  }
}
