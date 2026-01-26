import { GraphQLClient } from 'graphql-request';

const STRATZ_API_URL = 'https://api.stratz.com/graphql';

let client: GraphQLClient | null = null;

export function initStratzClient(token: string) {
  client = new GraphQLClient(STRATZ_API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'STRATZ_API',
    },
  });
}

export function getStratzClient(): GraphQLClient {
  if (!client) {
    const token = import.meta.env.VITE_STRATZ_API_TOKEN;
    if (!token) {
      throw new Error('STRATZ API token not found. Please set VITE_STRATZ_API_TOKEN in .env');
    }
    initStratzClient(token);
  }
  return client!;
}

// GraphQL Queries

export const GET_PLAYER_HEROES = `
  query GetPlayerHeroes($steamId: Long!, $request: PlayerMatchesRequestType!) {
    player(steamAccountId: $steamId) {
      steamAccount {
        id
        name
        avatar
      }
      heroesPerformance(request: $request) {
        heroId
        matchCount
      }
    }
  }
`;

export const GET_PLAYER_MATCHES = `
  query GetPlayerMatches($steamId: Long!, $request: PlayerMatchesRequestType!) {
    player(steamAccountId: $steamId) {
      matches(request: $request) {
        id
        startDateTime
        didRadiantWin
        isRadiant
        isLeague
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

export const GET_TEAM_MATCHES = `
  query GetTeamMatches($teamId: Int!, $request: TeamMatchesRequestType!) {
    team(teamId: $teamId) {
      matches(request: $request) {
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

export const GET_HEROES = `
  query GetHeroes {
    constants {
      heroes {
        id
        name
        displayName
        shortName
      }
    }
  }
`;

// Re-export Steam ID utilities
export { steam32ToSteam64, steam64ToSteam32, normalizeToSteam32 } from '@/utils/steamId';
