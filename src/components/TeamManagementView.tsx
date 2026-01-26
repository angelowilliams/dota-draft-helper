import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { TeamList } from './TeamList';
import { TeamForm } from './TeamForm';
import { useTeams, useTeamOperations } from '@/hooks/useTeams';
import { getOtherTeams } from '@/db/teams';
import toast from 'react-hot-toast';
import type { Team } from '@/types';

export function TeamManagementView() {
  const { teams: allTeams, loading: teamsLoading } = useTeams();
  const [otherTeams, setOtherTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const { createTeam, updateTeam, deleteTeam } = useTeamOperations();
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  useEffect(() => {
    loadOtherTeams();
  }, [allTeams]);

  const loadOtherTeams = async () => {
    setLoading(true);
    try {
      const teams = await getOtherTeams();
      setOtherTeams(teams);
    } catch (error) {
      console.error('Failed to load other teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (teamData: Omit<Team, 'id' | 'createdAt'>) => {
    try {
      await createTeam(teamData);
      toast.success('Team created successfully');
      setShowForm(false);
    } catch (error) {
      toast.error('Failed to create team');
      throw error;
    }
  };

  const handleUpdate = async (teamData: Omit<Team, 'id' | 'createdAt'>) => {
    if (!editingTeam) return;

    try {
      await updateTeam(editingTeam.id, teamData);
      toast.success('Team updated successfully');
      setEditingTeam(null);
      setShowForm(false);
    } catch (error) {
      toast.error('Failed to update team');
      throw error;
    }
  };

  const handleDelete = async (teamId: string) => {
    try {
      await deleteTeam(teamId);
      toast.success('Team deleted successfully');
    } catch (error) {
      toast.error('Failed to delete team');
    }
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTeam(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-dota-text-secondary">Loading teams...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Other Teams</h2>
          <p className="text-dota-text-secondary text-sm mt-1">
            Create and manage opponent team profiles for scouting
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-radiant flex items-center gap-2"
        >
          <Plus size={20} />
          New Team
        </button>
      </div>

      <TeamList
        teams={otherTeams}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSelect={() => {}}
        selectedTeamId={undefined}
      />

      {showForm && (
        <TeamForm
          onSubmit={editingTeam ? handleUpdate : handleCreate}
          onCancel={handleCancel}
          initialData={editingTeam || undefined}
        />
      )}
    </div>
  );
}
