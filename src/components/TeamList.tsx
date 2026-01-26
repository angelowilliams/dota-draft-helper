import { useState } from 'react';
import { Trash2, Edit, Users } from 'lucide-react';
import type { Team } from '@/types';

interface TeamListProps {
  teams: Team[];
  onEdit: (team: Team) => void;
  onDelete: (teamId: string) => void;
  onSelect: (team: Team) => void;
  selectedTeamId?: string;
}

export function TeamList({ teams, onEdit, onDelete, onSelect, selectedTeamId }: TeamListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (teamId: string) => {
    if (deletingId) return;

    if (confirm('Are you sure you want to delete this team? All associated player data will be removed.')) {
      setDeletingId(teamId);
      try {
        await onDelete(teamId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (teams.length === 0) {
    return (
      <div className="card text-center py-12">
        <Users size={48} className="mx-auto text-dota-text-muted mb-4" />
        <p className="text-dota-text-secondary mb-2">No teams yet</p>
        <p className="text-dota-text-muted text-sm">
          Create your first team to start scouting
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {teams.map((team) => (
        <div
          key={team.id}
          className={`card transition-all cursor-pointer ${
            selectedTeamId === team.id
              ? 'ring-2 ring-radiant'
              : 'hover:bg-dota-bg-tertiary'
          }`}
          onClick={() => onSelect(team)}
        >
          <div className="flex items-start justify-between">
            {team.teamLogo && (
              <img
                src={team.teamLogo}
                alt={`${team.name} logo`}
                className="w-16 h-16 rounded mr-4"
              />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">{team.name}</h3>
              <div className="text-sm text-dota-text-secondary space-y-1">
                {team.teamId && (
                  <p>
                    <span className="text-dota-text-muted">Team ID:</span> {team.teamId}
                  </p>
                )}
                <p className="text-xs text-dota-text-muted">
                  Created: {new Date(team.createdAt).toLocaleDateString()}
                </p>
                {team.lastUpdated && (
                  <p className="text-xs text-dota-text-muted">
                    Last updated: {new Date(team.lastUpdated).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 ml-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(team);
                }}
                className="p-2 hover:bg-dota-bg-primary rounded transition-colors text-dota-text-secondary hover:text-dota-text-primary"
                title="Edit team"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(team.id);
                }}
                disabled={deletingId === team.id}
                className="p-2 hover:bg-dire rounded transition-colors text-dota-text-secondary hover:text-white disabled:opacity-50"
                title="Delete team"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
