import { useState, useEffect, useMemo } from 'react';
import { X, Trash2 } from 'lucide-react';
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
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useHeroes } from '@/hooks/useHeroes';
import { updateManualHeroLists } from '@/db/teams';
import { getHeroStats } from '@/db/players';
import { getHeroPortraitUrl } from '@/config/heroes';
import toast from 'react-hot-toast';
import type { Team, HeroStats, Player } from '@/types';

interface ManualHeroManagerProps {
  team: Team;
  players?: Map<string, Player>;
  onClose?: () => void;
  onUpdate: () => void;
  embedded?: boolean;
}

interface SortableHeroItemProps {
  heroId: number;
  heroName: string;
  stats?: HeroStats;
  onRemove: () => void;
}

function SortableHeroItem({ heroId, heroName, stats, onRemove }: SortableHeroItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: heroId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const totalGames = stats ? stats.pubGames + stats.competitiveGames : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-1 rounded hover:bg-dota-bg-tertiary transition-colors cursor-move"
      {...attributes}
      {...listeners}
      title={heroName}
    >
      <img
        src={getHeroPortraitUrl(heroId)}
        alt={heroName}
        className="rounded flex-shrink-0"
        style={{ width: 'auto', height: 'auto', maxWidth: '48px' }}
      />
      <div className="flex-1 grid grid-cols-4 gap-2 text-xs text-center">
        <div className="font-medium text-dota-text-primary">{totalGames}</div>
        <div className="text-radiant font-medium">{stats?.competitiveGames || 0}</div>
        <div className="text-dota-text-secondary">
          {stats?.wins !== undefined && totalGames > 0
            ? `${Math.round((stats.wins / totalGames) * 100)}%`
            : '-'}
        </div>
        <div className="text-dota-text-secondary">
          {stats?.avgImp !== undefined ? stats.avgImp.toFixed(0) : '-'}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="text-dota-dire hover:text-dire-light p-1 flex-shrink-0"
        title="Remove hero"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

interface PlayerColumnProps {
  steamId: string;
  playerName?: string;
  heroList: number[];
  playerStats: HeroStats[];
  onAddHero: (heroId: number) => void;
  onRemoveHero: (heroId: number) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

function PlayerColumn({
  steamId,
  playerName,
  heroList,
  playerStats,
  onAddHero,
  onRemoveHero,
  onDragEnd,
}: PlayerColumnProps) {
  const { heroes } = useHeroes();
  const [searchQuery, setSearchQuery] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredHeroes = useMemo(() => {
    return heroes.filter((hero) => {
      const matchesSearch = hero.displayName.toLowerCase().startsWith(searchQuery.toLowerCase());
      const notInList = !heroList.includes(hero.id);
      return matchesSearch && notInList;
    });
  }, [heroes, heroList, searchQuery]);

  const heroesWithStats = useMemo(() => {
    return heroList.map((heroId) => {
      const hero = heroes.find((h) => h.id === heroId);
      const stats = playerStats.find((s) => s.heroId === heroId);
      return { heroId, hero, stats };
    });
  }, [heroList, heroes, playerStats]);

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="text-base font-semibold">
          <a
            href={`https://stratz.com/players/${steamId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-radiant hover:text-radiant-light transition-colors"
          >
            {playerName || `Player ${steamId.slice(-4)}`}
          </a>
        </h3>
      </div>

      {/* Add Hero Search */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Add hero..."
            className="input-field w-full text-sm"
          />
          {searchQuery && filteredHeroes.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-dota-bg-tertiary border border-dota-bg-tertiary rounded max-h-48 overflow-y-auto custom-scrollbar z-10">
              {filteredHeroes.slice(0, 10).map((hero) => (
                <button
                  key={hero.id}
                  onClick={() => {
                    onAddHero(hero.id);
                    setSearchQuery('');
                  }}
                  className="w-full flex items-center gap-2 p-2 hover:bg-dota-bg-secondary text-left"
                >
                  <img
                    src={getHeroPortraitUrl(hero.id)}
                    alt={hero.displayName}
                    className="rounded"
                    style={{ width: 'auto', height: 'auto', maxWidth: '48px' }}
                  />
                  <span className="text-sm">{hero.displayName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hero List */}
      {heroList.length === 0 ? (
        <div className="text-center py-8 text-dota-text-secondary">
          <p className="text-sm">No heroes added</p>
        </div>
      ) : (
        <div>
          {/* Header Row */}
          <div className="flex items-center gap-2 pb-2 border-b border-dota-bg-tertiary text-xs font-medium text-dota-text-muted">
            <div className="flex-shrink-0" style={{ width: '48px' }}>
              {/* Hero image space */}
            </div>
            <div className="flex-1 grid grid-cols-4 gap-2 text-center">
              <div>Total</div>
              <div>Comp</div>
              <div>Win%</div>
              <div>IMP</div>
            </div>
            <div className="flex-shrink-0" style={{ width: '24px' }}>
              {/* Remove button space */}
            </div>
          </div>

          {/* Scrollable Hero Rows */}
          <div className="space-y-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: '480px' }}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext items={heroList} strategy={verticalListSortingStrategy}>
                {heroesWithStats.map(({ heroId, hero, stats }) => (
                  <SortableHeroItem
                    key={heroId}
                    heroId={heroId}
                    heroName={hero?.displayName || 'Unknown'}
                    stats={stats}
                    onRemove={() => onRemoveHero(heroId)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>
      )}
    </div>
  );
}

export function ManualHeroManager({ team, players, onClose, onUpdate, embedded = false }: ManualHeroManagerProps) {
  const [heroLists, setHeroLists] = useState<number[][]>(
    team.manualHeroLists || [[], [], [], [], []]
  );
  const [playerStats, setPlayerStats] = useState<Map<string, HeroStats[]>>(new Map());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPlayerStats();
  }, [team.playerIds]);

  const loadPlayerStats = async () => {
    const statsMap = new Map<string, HeroStats[]>();
    for (const steamId of team.playerIds) {
      const stats = await getHeroStats(steamId);
      statsMap.set(steamId, stats);
    }
    setPlayerStats(statsMap);
  };

  const handleAddHero = (playerIndex: number, heroId: number) => {
    const newLists = [...heroLists];
    newLists[playerIndex] = [...newLists[playerIndex], heroId];
    setHeroLists(newLists);
  };

  const handleRemoveHero = (playerIndex: number, heroId: number) => {
    const newLists = [...heroLists];
    newLists[playerIndex] = newLists[playerIndex].filter((id) => id !== heroId);
    setHeroLists(newLists);
  };

  const handleDragEnd = (playerIndex: number, event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const currentList = heroLists[playerIndex];
      const oldIndex = currentList.indexOf(active.id as number);
      const newIndex = currentList.indexOf(over.id as number);

      const newLists = [...heroLists];
      newLists[playerIndex] = arrayMove(currentList, oldIndex, newIndex);
      setHeroLists(newLists);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateManualHeroLists(team.id, heroLists);
      toast.success('Hero lists saved successfully');
      onUpdate();
      if (onClose && !embedded) {
        onClose();
      }
    } catch (error) {
      toast.error('Failed to save hero lists');
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <>
      <div className="grid grid-cols-5 gap-4">
        {team.playerIds.map((steamId, idx) => {
          const player = players?.get(steamId);
          return (
            <PlayerColumn
              key={steamId}
              steamId={steamId}
              playerName={player?.name}
              heroList={heroLists[idx] || []}
              playerStats={playerStats.get(steamId) || []}
              onAddHero={(heroId) => handleAddHero(idx, heroId)}
              onRemoveHero={(heroId) => handleRemoveHero(idx, heroId)}
              onDragEnd={(event) => handleDragEnd(idx, event)}
            />
          );
        })}
      </div>

      <div className="flex gap-3 justify-end mt-6">
        {!embedded && onClose && (
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
        )}
        <button onClick={handleSave} className="btn-radiant" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </>
  );

  if (embedded) {
    return <div className="space-y-6">{content}</div>;
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dota-bg-secondary rounded-lg w-full max-h-[90vh] flex flex-col border border-dota-bg-tertiary" style={{ maxWidth: '1600px' }}>
        <div className="flex items-center justify-between p-6 border-b border-dota-bg-tertiary">
          <h2 className="text-2xl font-bold">Manage Hero Lists - {team.name}</h2>
          <button onClick={onClose} className="text-dota-text-secondary hover:text-dota-text-primary">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {content}
        </div>
      </div>
    </div>
  );
}
