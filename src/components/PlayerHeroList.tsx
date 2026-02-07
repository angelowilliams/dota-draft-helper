import { useMemo } from 'react';
import { getHeroPortraitUrl } from '@/config/heroes';
import type { HeroStats, Hero, Player } from '@/types';

interface PlayerHeroListProps {
  steamId: string;
  player?: Player;
  heroStats: HeroStats[];
  heroes: Hero[];
  searchFilter?: string;
}

export function PlayerHeroList({
  steamId,
  player,
  heroStats,
  heroes,
  searchFilter = '',
}: PlayerHeroListProps) {
  const filteredAndSortedHeroes = useMemo(() => {
    if (!heroStats || !Array.isArray(heroStats)) {
      return [];
    }

    if (!heroes || !Array.isArray(heroes)) {
      return [];
    }

    return heroStats
      .map((stat) => {
        if (!stat || typeof stat.heroId !== 'number') return null;

        const hero = heroes.find((h) => h.id === stat.heroId);
        if (!hero) return null;

        if (searchFilter) {
          const lowerSearch = searchFilter.toLowerCase();
          if (!hero.displayName.toLowerCase().startsWith(lowerSearch) &&
              !hero.name.toLowerCase().startsWith(lowerSearch)) {
            return null;
          }
        }

        return { hero, stat };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.stat.games - a.stat.games);
  }, [heroStats, heroes, searchFilter]);

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="text-base font-semibold">
          <a
            href={`https://www.opendota.com/players/${steamId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-radiant hover:text-radiant-light transition-colors"
          >
            {player?.name || `Player ${steamId.slice(-4)}`}
          </a>
        </h3>
      </div>

      {filteredAndSortedHeroes.length === 0 ? (
        <div className="text-center py-8 text-dota-text-secondary">
          <p className="text-sm">
            {searchFilter ? `No heroes matching "${searchFilter}"` : 'No hero data'}
          </p>
        </div>
      ) : (
        <div>
          {/* Header Row */}
          <div className="flex items-center gap-2 pb-2 border-b border-dota-bg-tertiary text-xs font-medium text-dota-text-muted">
            <div className="flex-shrink-0" style={{ width: '48px' }} />
            <div className="flex-1 grid grid-cols-2 gap-2 text-center">
              <div>Games</div>
              <div>Win%</div>
            </div>
          </div>

          {/* Scrollable Hero Rows */}
          <div className="space-y-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: '580px' }}>
            {filteredAndSortedHeroes.map(({ hero, stat }) => (
              <div
                key={hero.id}
                className="flex items-center gap-2 p-1 rounded hover:bg-dota-bg-tertiary transition-colors"
                title={hero.displayName}
              >
                <img
                  src={getHeroPortraitUrl(hero.id)}
                  alt={hero.displayName}
                  className="rounded flex-shrink-0"
                  style={{ width: 'auto', height: 'auto', maxWidth: '48px' }}
                />
                <div className="flex-1 grid grid-cols-2 gap-2 text-xs text-center">
                  <div className="font-medium text-dota-text-primary">{stat.games}</div>
                  <div className="text-dota-text-secondary">
                    {stat.games > 0
                      ? `${Math.round((stat.wins / stat.games) * 100)}%`
                      : '-'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
