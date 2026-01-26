import { getStratzClient, normalizeToSteam32 } from './stratz';
import type { StratzPlayer, HeroStats } from '@/types';

interface FetchPlayerHeroesParams {
  steamId: string;
}

export async function fetchPlayerHeroes(
  params: FetchPlayerHeroesParams
): Promise<{ player: StratzPlayer; heroStats: HeroStats[] }> {
  const client = getStratzClient();
  const steam32Id = normalizeToSteam32(params.steamId);

  const query = `
    query GetPlayerHeroes($steamId: Long!) {
      player(steamAccountId: $steamId) {
        steamAccount {
          id
          name
          avatar
          proSteamAccount {
            name
          }
        }
        matches(
          request: {
            gameModeIds: [1, 2, 3, 4, 5, 10, 16, 22]
            take: 100
          }
        ) {
          id
          didRadiantWin
          gameMode
          lobbyType
          players(steamAccountId: $steamId) {
            isRadiant
            heroId
            imp
          }
        }
      }
    }
  `;

  try {
    const data: any = await client.request(query, {
      steamId: steam32Id,
    });

    if (!data || !data.player) {
      throw new Error(`Player not found: ${params.steamId}`);
    }

    if (!data.player.steamAccount) {
      throw new Error(`Invalid player data for: ${params.steamId}`);
    }

    // Aggregate match data by hero
    const heroStatsMap = new Map<
      number,
      {
        pubGames: number;
        compGames: number;
        wins: number;
        impSum: number;
        totalGames: number;
      }
    >();

    data.player.matches?.forEach((match: any) => {
      if (!match.players || match.players.length === 0) return;

      const playerData = match.players[0];
      const heroId = playerData.heroId;

      if (!heroId) return;

      // Determine if this is a competitive match (lobby type 1 = tournament/league)
      const isCompetitive = match.lobbyType === 1;

      // Determine if player won
      const didWin = match.didRadiantWin === playerData.isRadiant;

      // Get or create hero stats entry
      let stats = heroStatsMap.get(heroId);
      if (!stats) {
        stats = {
          pubGames: 0,
          compGames: 0,
          wins: 0,
          impSum: 0,
          totalGames: 0,
        };
        heroStatsMap.set(heroId, stats);
      }

      // Update stats
      stats.totalGames++;
      if (isCompetitive) {
        stats.compGames++;
      } else {
        stats.pubGames++;
      }
      if (didWin) {
        stats.wins++;
      }
      if (playerData.imp) {
        stats.impSum += playerData.imp;
      }
    });

    // Build final hero stats
    const heroStats: HeroStats[] = Array.from(heroStatsMap.entries())
      .map(([heroId, stats]) => ({
        steamId: params.steamId,
        heroId,
        pubGames: stats.pubGames,
        competitiveGames: stats.compGames,
        wins: stats.wins,
        avgImp: stats.totalGames > 0 ? stats.impSum / stats.totalGames : 0,
        lastPlayed: new Date(),
      }))
      .filter((stat) => stat.pubGames > 0 || stat.competitiveGames > 0);

    return {
      player: data.player,
      heroStats,
    };
  } catch (error) {
    console.error('Failed to fetch player heroes:', error);
    throw error;
  }
}

export async function fetchMultiplePlayerHeroes(
  steamIds: string[]
): Promise<Map<string, HeroStats[]>> {
  const results = new Map<string, HeroStats[]>();

  // Fetch all players in parallel
  const promises = steamIds.map(async (steamId) => {
    try {
      const { heroStats } = await fetchPlayerHeroes({
        steamId,
      });
      return { steamId, heroStats };
    } catch (error) {
      console.error(`Failed to fetch data for player ${steamId}:`, error);
      return { steamId, heroStats: [] };
    }
  });

  const responses = await Promise.all(promises);

  responses.forEach(({ steamId, heroStats }) => {
    results.set(steamId, heroStats);
  });

  return results;
}
