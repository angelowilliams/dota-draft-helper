import { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { TeamForm } from './TeamForm';
import { ManualHeroManager } from './ManualHeroManager';
import { useTeams, useTeamOperations } from '@/hooks/useTeams';
import { usePlayerData } from '@/hooks/usePlayerData';
import { getYourTeam, setAsYourTeam } from '@/db/teams';
import toast from 'react-hot-toast';
import type { Team } from '@/types';

export function YourTeamView() {
  const { teams } = useTeams();
  const { createTeam, deleteTeam } = useTeamOperations();
  const [yourTeam, setYourTeamState] = useState<Team | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadYourTeam();
  }, [teams]);

  const loadYourTeam = async () => {
    try {
      const team = await getYourTeam();
      setYourTeamState(team || null);
    } catch (error) {
      console.error('Failed to load your team:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use player data hook for fetching and caching player data
  const { players, loading: dataLoading, refetch } = usePlayerData({
    steamIds: yourTeam?.playerIds || [],
    autoFetch: false,
  });

  const handleCreate = async (teamData: Omit<Team, 'id' | 'createdAt'>) => {
    try {
      const teamId = await createTeam(teamData);
      await setAsYourTeam(teamId);
      toast.success('Your Team created successfully');
      setShowForm(false);
      await loadYourTeam();
    } catch (error) {
      toast.error('Failed to create team');
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!yourTeam) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete Your Team? This will remove all manual hero lists.'
    );

    if (!confirmed) return;

    try {
      await deleteTeam(yourTeam.id);
      toast.success('Your Team deleted successfully');
      setYourTeamState(null);
    } catch (error) {
      toast.error('Failed to delete team');
    }
  };

  const handleRefresh = async () => {
    if (!yourTeam) return;

    try {
      await refetch();
      toast.success('Player data refreshed from STRATZ');
    } catch (error) {
      toast.error('Failed to refresh player data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-dota-text-secondary">Loading your team...</p>
      </div>
    );
  }

  if (!yourTeam) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Your Team</h2>
            <p className="text-dota-text-secondary text-sm mt-1">
              Manage your team with custom hero lists for each player
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-radiant flex items-center gap-2"
          >
            <Plus size={20} />
            Create Your Team
          </button>
        </div>

        <div className="card text-center py-12">
          <p className="text-dota-text-secondary mb-4">
            You haven't created your team yet. Create one to manage custom hero lists.
          </p>
        </div>

        {showForm && (
          <TeamForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {yourTeam.teamLogo && (
            <img
              src={yourTeam.teamLogo}
              alt={yourTeam.name}
              className="w-16 h-16 object-contain"
            />
          )}
          <div>
            <h2 className="text-2xl font-bold">{yourTeam.name}</h2>
            <p className="text-dota-text-secondary text-sm mt-1">
              Manage custom hero lists for each player
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={dataLoading}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw size={18} className={dataLoading ? 'animate-spin' : ''} />
            {dataLoading ? 'Refreshing...' : 'Refresh Player Data'}
          </button>
          <button onClick={handleDelete} className="btn-dire flex items-center gap-2">
            <Trash2 size={18} />
            Delete Team
          </button>
        </div>
      </div>

      <ManualHeroManager
        team={yourTeam}
        players={players}
        onUpdate={loadYourTeam}
        embedded={true}
      />
    </div>
  );
}
