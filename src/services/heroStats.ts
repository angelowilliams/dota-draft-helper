import type { HeroStats, Hero } from '@/types';

export interface HeroWithStats {
  hero: Hero;
  stat: HeroStats;
  totalGames: number;
}

/**
 * Calculates win rate as a percentage (0-100)
 */
export function calculateWinRate(wins: number, totalGames: number): number {
  if (totalGames <= 0) return 0;
  return Math.round((wins / totalGames) * 100);
}

/**
 * Sorts heroes by total games played (descending)
 */
export function sortHeroesByGames(items: HeroWithStats[]): HeroWithStats[] {
  return [...items].sort((a, b) => b.totalGames - a.totalGames);
}

/**
 * Filters heroes by name prefix match (case-insensitive)
 */
export function filterHeroesByName(
  items: HeroWithStats[],
  searchTerm: string
): HeroWithStats[] {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return items;
  }

  const lowerSearch = searchTerm.toLowerCase();
  return items.filter(
    (item) =>
      item.hero.displayName.toLowerCase().startsWith(lowerSearch) ||
      item.hero.name.toLowerCase().startsWith(lowerSearch)
  );
}

/**
 * Merges hero stats with hero metadata
 */
export function mergeHeroStatsWithMetadata(
  stats: HeroStats[],
  heroes: Hero[]
): HeroWithStats[] {
  if (!stats || !Array.isArray(stats)) return [];
  if (!heroes || !Array.isArray(heroes)) return [];

  return stats
    .map((stat) => {
      if (!stat || typeof stat.heroId !== 'number') {
        return null;
      }

      const hero = heroes.find((h) => h.id === stat.heroId);
      if (!hero) return null;

      return {
        hero,
        stat,
        totalGames: stat.pubGames + stat.competitiveGames,
      };
    })
    .filter((item): item is HeroWithStats => item !== null);
}

/**
 * Creates a HeroWithStats from hero ID using manual hero list
 * Used when player has a manual hero list defined
 */
export function createHeroWithStatsFromManualList(
  heroId: number,
  steamId: string,
  heroes: Hero[],
  existingStats?: HeroStats[]
): HeroWithStats | null {
  const hero = heroes.find((h) => h.id === heroId);
  if (!hero) return null;

  // Check if stats exist for this hero
  const stat = existingStats?.find((s) => s.heroId === heroId);

  return {
    hero,
    stat: stat || {
      steamId,
      heroId,
      lobbyTypeFilter: 'all',
      pubGames: 0,
      competitiveGames: 0,
      wins: 0,
      avgImp: 0,
    },
    totalGames: stat ? stat.pubGames + stat.competitiveGames : 0,
  };
}

/**
 * Builds hero list from manual hero IDs, preserving order
 */
export function buildManualHeroList(
  manualHeroIds: number[],
  steamId: string,
  heroes: Hero[],
  existingStats?: HeroStats[]
): HeroWithStats[] {
  if (!manualHeroIds || !Array.isArray(manualHeroIds) || manualHeroIds.length === 0) {
    return [];
  }

  return manualHeroIds
    .map((heroId) => createHeroWithStatsFromManualList(heroId, steamId, heroes, existingStats))
    .filter((item): item is HeroWithStats => item !== null);
}
