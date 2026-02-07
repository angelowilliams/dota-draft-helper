import { useState } from 'react';
import { Plus, Download } from 'lucide-react';
import { TeamList } from './TeamList';
import { TeamForm } from './TeamForm';
import { AD2LImportModal } from './AD2LImportModal';
import { useTeams, useTeamOperations } from '@/hooks/useTeams';
import toast from 'react-hot-toast';
import type { Team } from '@/types';

export function TeamsView() {
  const { teams } = useTeams();
  const { createTeam, updateTeam, deleteTeam, toggleFavorite } = useTeamOperations();
  const [showForm, setShowForm] = useState(false);
  const [showAD2LImport, setShowAD2LImport] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const handleCreate = async (teamData: Omit<Team, 'id' | 'createdAt'>) => {
    try {
      await createTeam(teamData);
      toast.success('Team created');
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
      toast.success('Team updated');
      setEditingTeam(null);
      setShowForm(false);
    } catch (error) {
      toast.error('Failed to update team');
      throw error;
    }
  };

  const handleDelete = async (teamId: string) => {
    try {
      if (expandedTeamId === teamId) setExpandedTeamId(null);
      await deleteTeam(teamId);
      toast.success('Team deleted');
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

  const handleToggleExpand = (teamId: string) => {
    setExpandedTeamId(prev => prev === teamId ? null : teamId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Teams</h2>
          <p className="text-dota-text-secondary text-sm mt-1">
            Manage teams and hero lists
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAD2LImport(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Download size={20} />
            Import from AD2L
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="btn-radiant flex items-center gap-2"
          >
            <Plus size={20} />
            Add Team
          </button>
        </div>
      </div>

      <TeamList
        teams={teams}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleFavorite={toggleFavorite}
        expandedTeamId={expandedTeamId}
        onToggleExpand={handleToggleExpand}
      />

      {showForm && (
        <TeamForm
          onSubmit={editingTeam ? handleUpdate : handleCreate}
          onCancel={handleCancel}
          initialData={editingTeam || undefined}
        />
      )}

      {showAD2LImport && (
        <AD2LImportModal
          onImport={handleCreate}
          onCancel={() => setShowAD2LImport(false)}
        />
      )}
    </div>
  );
}
