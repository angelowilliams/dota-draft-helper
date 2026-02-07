import { opendotaFetch } from './opendota';

export interface TeamInfo {
  id: number;
  name: string;
  tag?: string;
  logo?: string;
}

interface OpenDotaTeamResponse {
  team_id: number;
  name: string;
  tag: string;
  logo_url: string;
}

export async function fetchTeamInfo(teamId: number): Promise<TeamInfo | null> {
  try {
    const data = await opendotaFetch<OpenDotaTeamResponse>(`/teams/${teamId}`);

    if (!data || !data.name) {
      return null;
    }

    return {
      id: data.team_id,
      name: data.name,
      tag: data.tag,
      logo: data.logo_url,
    };
  } catch (error) {
    console.error('Failed to fetch team info:', error);
    return null;
  }
}
