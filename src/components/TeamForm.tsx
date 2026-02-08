import { useState } from 'react';
import { X, GripVertical } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { validateTeamForm } from '@/utils/validation';
import { getPlayer } from '@/db/players';
import type { Team } from '@/types';

interface TeamFormProps {
  onSubmit: (team: Omit<Team, 'id' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
  initialData?: Team;
}

interface SortablePlayerInputProps {
  id: string;
  index: number;
  playerId: string;
  playerName?: string;
  error?: string;
  onUpdate: (index: number, value: string) => void;
}

function SortablePlayerInput({
  id,
  index,
  playerId,
  playerName,
  error,
  onUpdate,
}: SortablePlayerInputProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-dota-text-muted hover:text-dota-text-primary"
        >
          <GripVertical size={20} />
        </div>
        <input
          type="text"
          value={playerId}
          onChange={(e) => onUpdate(index, e.target.value)}
          className="input-field flex-1"
          placeholder={`Player ${index + 1} Steam ID (e.g., 93712692)`}
        />
        {playerName && (
          <span className="text-sm text-dota-text-secondary whitespace-nowrap">
            {playerName}
          </span>
        )}
      </div>
      {error && <p className="text-dire text-sm mt-1">{error}</p>}
    </div>
  );
}

export function TeamForm({ onSubmit, onCancel, initialData }: TeamFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [teamId, setTeamId] = useState(initialData?.teamId || '');
  const [playerIds, setPlayerIds] = useState<string[]>(
    initialData?.playerIds || ['', '', '', '', '']
  );
  const [altAccountMap, setAltAccountMap] = useState<Record<string, string[]>>(
    initialData?.altAccountMap || {}
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addAlt = (playerIndex: number) => {
    const mainId = playerIds[playerIndex];
    if (!mainId.trim()) return;
    setAltAccountMap(prev => ({
      ...prev,
      [mainId]: [...(prev[mainId] || []), ''],
    }));
  };

  const updateAlt = (mainId: string, altIndex: number, value: string) => {
    setAltAccountMap(prev => {
      const alts = [...(prev[mainId] || [])];
      alts[altIndex] = value;
      return { ...prev, [mainId]: alts };
    });
  };

  const removeAlt = (mainId: string, altIndex: number) => {
    setAltAccountMap(prev => {
      const alts = (prev[mainId] || []).filter((_, i) => i !== altIndex);
      const next = { ...prev };
      if (alts.length === 0) {
        delete next[mainId];
      } else {
        next[mainId] = alts;
      }
      return next;
    });
  };

  // Fetch player names from IndexedDB
  const playerNames = useLiveQuery(async () => {
    const names: Record<string, string> = {};
    for (const steamId of playerIds) {
      if (steamId && steamId.trim().length > 0) {
        const player = await getPlayer(steamId.trim());
        if (player && player.name) {
          names[steamId] = player.name;
        }
      }
    }
    return names;
  }, [playerIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateTeamForm({
      name: name.trim(),
      playerIds: playerIds.map(id => id.trim()),
      teamId: teamId.trim(),
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      // Clean altAccountMap: remove empty entries, trim IDs
      const cleanedAltMap: Record<string, string[]> = {};
      for (const [mainId, alts] of Object.entries(altAccountMap)) {
        const cleanedAlts = alts.map(a => a.trim()).filter(a => a.length > 0);
        if (cleanedAlts.length > 0) {
          cleanedAltMap[mainId] = cleanedAlts;
        }
      }

      await onSubmit({
        name: name.trim(),
        playerIds: playerIds.map(id => id.trim()),
        teamId: teamId.trim() || undefined,
        ...(Object.keys(cleanedAltMap).length > 0 && { altAccountMap: cleanedAltMap }),
      });
      onCancel();
    } catch (error) {
      console.error('Failed to save team:', error);
      setErrors({ submit: 'Failed to save team. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const updatePlayerId = (index: number, value: string) => {
    const oldId = playerIds[index];
    const newPlayerIds = [...playerIds];
    newPlayerIds[index] = value;
    setPlayerIds(newPlayerIds);

    // Transfer alts from old ID to new ID
    if (oldId !== value && altAccountMap[oldId]) {
      setAltAccountMap(prev => {
        const next = { ...prev };
        const alts = next[oldId];
        delete next[oldId];
        if (value.trim() && alts) {
          next[value] = alts;
        }
        return next;
      });
    }

    if (errors[`player${index}`]) {
      const newErrors = { ...errors };
      delete newErrors[`player${index}`];
      setErrors(newErrors);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id.toString());
      const newIndex = parseInt(over.id.toString());

      setPlayerIds((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            {initialData ? 'Edit Team' : 'Create New Team'}
          </h2>
          <button
            onClick={onCancel}
            className="text-dota-text-secondary hover:text-dota-text-primary transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Team Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) {
                  const newErrors = { ...errors };
                  delete newErrors.name;
                  setErrors(newErrors);
                }
              }}
              className="input-field w-full"
              placeholder="Enter team name"
            />
            {errors.name && (
              <p className="text-dire text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Team ID (Optional)
            </label>
            <input
              type="text"
              value={teamId}
              onChange={(e) => {
                setTeamId(e.target.value);
                if (errors.teamId) {
                  const newErrors = { ...errors };
                  delete newErrors.teamId;
                  setErrors(newErrors);
                }
              }}
              className="input-field w-full"
              placeholder="Enter team ID (optional)"
            />
            <p className="text-dota-text-muted text-xs mt-1">
              Used for fetching competitive match history
            </p>
            {errors.teamId && (
              <p className="text-dire text-sm mt-1">{errors.teamId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Player Steam IDs * (5 required) - Drag to reorder
            </label>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={playerIds.map((_, index) => index.toString())}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {playerIds.map((playerId, index) => (
                    <div key={index}>
                      <SortablePlayerInput
                        id={index.toString()}
                        index={index}
                        playerId={playerId}
                        playerName={playerNames?.[playerId]}
                        error={errors[`player${index}`]}
                        onUpdate={updatePlayerId}
                      />
                      {/* Alt accounts for this player */}
                      {altAccountMap[playerId]?.map((altId, altIdx) => (
                        <div key={altIdx} className="flex items-center gap-2 ml-8 mt-1">
                          <span className="text-dota-text-muted text-sm">{'\u21b3'}</span>
                          <input
                            type="text"
                            value={altId}
                            onChange={(e) => updateAlt(playerId, altIdx, e.target.value)}
                            className="input-field flex-1 text-sm"
                            placeholder="Alt account Steam ID"
                          />
                          <button
                            type="button"
                            onClick={() => removeAlt(playerId, altIdx)}
                            className="text-dota-text-muted hover:text-dire text-sm"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      {playerId.trim() && (
                        <button
                          type="button"
                          onClick={() => addAlt(index)}
                          className="text-xs text-dota-text-muted hover:text-dota-text-secondary ml-8 mt-1"
                        >
                          + Alt account
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {errors.playerIds && (
              <p className="text-dire text-sm mt-1">{errors.playerIds}</p>
            )}
            <p className="text-dota-text-muted text-xs mt-2">
              Use the Steam ID from your OpenDota profile URL (opendota.com/players/YOUR_ID) or find it at{' '}
              <a
                href="https://www.steamid.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-radiant hover:underline"
              >
                steamid.io
              </a>
            </p>
          </div>

          {errors.submit && (
            <p className="text-dire text-sm">{errors.submit}</p>
          )}

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="btn-radiant flex-1"
            >
              {submitting ? 'Saving...' : initialData ? 'Update Team' : 'Create Team'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="btn-primary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
