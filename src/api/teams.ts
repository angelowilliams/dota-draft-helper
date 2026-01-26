import { getStratzClient } from './stratz';

export interface TeamInfo {
  id: number;
  name: string;
  tag?: string;
  logo?: string;
}

export async function fetchTeamInfo(teamId: number): Promise<TeamInfo | null> {
  const client = getStratzClient();

  const query = `
    query GetTeam($teamId: Int!) {
      team(teamId: $teamId) {
        id
        name
        tag
        logo
      }
    }
  `;

  try {
    const data: any = await client.request(query, { teamId });

    if (!data.team) {
      return null;
    }

    return {
      id: data.team.id,
      name: data.team.name,
      tag: data.team.tag,
      logo: data.team.logo,
    };
  } catch (error) {
    console.error('Failed to fetch team info:', error);
    return null;
  }
}
