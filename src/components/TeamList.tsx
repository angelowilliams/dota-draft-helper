import { useState } from 'react';
import { Trash2, Edit, Users, Star, ChevronDown, ChevronRight } from 'lucide-react';
import { ManualHeroManager } from './ManualHeroManager';
import { usePlayerData } from '@/hooks/usePlayerData';
import type { Team } from '@/types';

interface TeamListProps {
  teams: Team[];
  onEdit: (team: Team) => void;
  onDelete: (teamId: string) => void;
  onToggleFavorite: (teamId: string) => void;
  expandedTeamId: string | null;
  onToggleExpand: (teamId: string) => void;
}

function ExpandedTeamSection({ team, onUpdate }: { team: Team; onUpdate: () => void }) {
  const { players } = usePlayerData({ steamIds: team.playerIds });

  return (
    <div className="mt-4 pt-4 border-t border-dota-bg-tertiary">
      <ManualHeroManager
        team={{ ...team, manualHeroLists: team.manualHeroLists || [[], [], [], [], []] }}
        players={players}
        onUpdate={onUpdate}
        embedded={true}
      />
    </div>
  );
}

export function TeamList({ teams, onEdit, onDelete, onToggleFavorite, expandedTeamId, onToggleExpand }: TeamListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (teamId: string) => {
    if (deletingId) return;

    if (confirm('Are you sure you want to delete this team?')) {
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
          Add a team to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {teams.map((team) => {
        const isExpanded = expandedTeamId === team.id;
        return (
          <div
            key={team.id}
            className={`card transition-all ${
              isExpanded ? 'ring-2 ring-radiant' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => onToggleExpand(team.id)}
              >
                {isExpanded ? (
                  <ChevronDown size={18} className="text-dota-text-muted flex-shrink-0" />
                ) : (
                  <ChevronRight size={18} className="text-dota-text-muted flex-shrink-0" />
                )}
                {team.teamLogo && (
                  <img
                    src={team.teamLogo}
                    alt={`${team.name} logo`}
                    className="w-12 h-12 rounded flex-shrink-0"
                  />
                )}
                <div>
                  <h3 className="text-lg font-semibold">{team.name}</h3>
                  <div className="text-xs text-dota-text-muted">
                    {team.playerIds.length} players
                    {team.manualHeroLists?.some(l => l.length > 0) && (
                      <span className="ml-2 text-radiant">Hero lists configured</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-1 ml-4 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(team.id);
                  }}
                  className={`p-2 rounded transition-colors ${
                    team.favorite
                      ? 'text-yellow-400 hover:text-yellow-300'
                      : 'text-dota-text-muted hover:text-yellow-400'
                  }`}
                  title={team.favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star size={18} fill={team.favorite ? 'currentColor' : 'none'} />
                </button>
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

            {isExpanded && (
              <ExpandedTeamSection
                team={team}
                onUpdate={() => {}}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
