import { useMemo } from 'react';
import { getHeroPortraitUrl } from '@/config/heroes';
import type { HeroStats, Hero } from '@/types';

interface HeroStatsTableProps {
  steamIds: string[];
  heroStatsMap: Map<string, HeroStats[]>;
  heroes: Hero[];
  searchFilter?: string;
}

interface HeroRow {
  heroId: number;
  hero: Hero;
  playerGames: Map<string, number>;
  totalGames: number;
}

export function HeroStatsTable({
  steamIds,
  heroStatsMap,
  heroes,
  searchFilter = '',
}: HeroStatsTableProps) {
  const rows = useMemo(() => {
    // Collect all unique hero IDs across all players
    const heroIds = new Set<number>();
    heroStatsMap.forEach((stats) => {
      stats.forEach((stat) => heroIds.add(stat.heroId));
    });

    // Build rows
    const heroRows: HeroRow[] = Array.from(heroIds)
      .map((heroId) => {
        const hero = heroes.find((h) => h.id === heroId);
        if (!hero) return null;

        // Apply search filter
        if (
          searchFilter &&
          !hero.displayName.toLowerCase().includes(searchFilter.toLowerCase()) &&
          !hero.name.toLowerCase().includes(searchFilter.toLowerCase())
        ) {
          return null;
        }

        const playerGames = new Map<string, number>();
        let totalGames = 0;

        steamIds.forEach((steamId) => {
          const stats = heroStatsMap.get(steamId) || [];
          const heroStat = stats.find((s) => s.heroId === heroId);
          const games = heroStat?.games || 0;
          playerGames.set(steamId, games);
          totalGames += games;
        });

        return {
          heroId,
          hero,
          playerGames,
          totalGames,
        };
      })
      .filter((row): row is HeroRow => row !== null)
      .sort((a, b) => b.totalGames - a.totalGames);

    return heroRows;
  }, [heroStatsMap, heroes, steamIds, searchFilter]);

  if (steamIds.length === 0) {
    return (
      <div className="text-center py-8 text-dota-text-secondary">
        <p>No players selected</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-8 text-dota-text-secondary">
        <p>
          {searchFilter
            ? `No heroes found matching "${searchFilter}"`
            : 'No hero data available'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-dota-bg-tertiary">
            <th className="sticky left-0 z-10 bg-dota-bg-tertiary px-4 py-3 text-left border-b border-dota-bg-primary">
              Hero
            </th>
            {steamIds.map((steamId, index) => (
              <th
                key={steamId}
                className="px-4 py-3 text-center border-b border-dota-bg-primary"
              >
                <div className="text-sm font-medium">Player {index + 1}</div>
              </th>
            ))}
            <th className="px-4 py-3 text-center border-b border-dota-bg-primary">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.heroId}
              className="hover:bg-dota-bg-tertiary transition-colors"
            >
              <td className="sticky left-0 z-10 bg-dota-bg-secondary hover:bg-dota-bg-tertiary px-4 py-2 border-b border-dota-bg-tertiary">
                <div className="flex items-center gap-3">
                  <img
                    src={getHeroPortraitUrl(row.heroId)}
                    alt={row.hero.displayName}
                    className="w-12 h-12 rounded"
                    loading="lazy"
                  />
                  <span className="text-sm font-medium">
                    {row.hero.displayName}
                  </span>
                </div>
              </td>
              {steamIds.map((steamId) => {
                const games = row.playerGames.get(steamId) || 0;
                return (
                  <td
                    key={`${row.heroId}-${steamId}`}
                    className="px-4 py-2 text-center border-b border-dota-bg-tertiary"
                  >
                    <span className={games > 0 ? 'text-sm text-dota-text-primary font-medium' : 'text-sm text-dota-text-muted'}>
                      {games}
                    </span>
                  </td>
                );
              })}
              <td className="px-4 py-2 text-center border-b border-dota-bg-tertiary">
                <span className="text-sm font-semibold text-dota-text-primary">
                  {row.totalGames}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
