import { useLiveQuery } from 'dexie-react-hooks';
import { getAllTeams, createTeam, updateTeam, deleteTeam, toggleFavorite } from '@/db/teams';
import { fetchTeamInfo } from '@/api/teams';
import toast from 'react-hot-toast';
import type { Team } from '@/types';

export function useTeams() {
  const teams = useLiveQuery(() => getAllTeams(), []);

  return {
    teams: teams || [],
    loading: teams === undefined,
  };
}

export function useTeamOperations() {
  const handleCreate = async (team: Omit<Team, 'id' | 'createdAt'>) => {
    let teamLogo: string | undefined;

    // Fetch team logo if teamId is provided
    if (team.teamId) {
      try {
        const teamInfo = await Promise.race([
          fetchTeamInfo(parseInt(team.teamId, 10)),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('API request timeout')), 10000)
          )
        ]);
        teamLogo = teamInfo?.logo;
      } catch (error) {
        console.error('Failed to fetch team logo:', error);
        toast.error('Could not fetch team logo (API may be rate limited), but team was created successfully', {
          duration: 4000,
        });
      }
    }

    return createTeam({
      ...team,
      teamLogo,
    });
  };

  const handleUpdate = async (id: string, updates: Partial<Omit<Team, 'id' | 'createdAt'>>) => {
    let teamLogo: string | undefined;

    // Fetch team logo if teamId is provided
    if (updates.teamId) {
      try {
        const teamInfo = await Promise.race([
          fetchTeamInfo(parseInt(updates.teamId, 10)),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('API request timeout')), 10000)
          )
        ]);
        teamLogo = teamInfo?.logo;
      } catch (error) {
        console.error('Failed to fetch team logo:', error);
        toast.error('Could not fetch team logo (API may be rate limited), but team was updated successfully', {
          duration: 4000,
        });
      }
    }

    return updateTeam(id, {
      ...updates,
      teamLogo,
    });
  };

  const handleDelete = async (id: string) => {
    return deleteTeam(id);
  };

  return {
    createTeam: handleCreate,
    updateTeam: handleUpdate,
    deleteTeam: handleDelete,
    toggleFavorite,
  };
}
