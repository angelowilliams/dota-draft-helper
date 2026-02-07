import { describe, it, expect } from 'vitest';
import {
  calculateWinRate,
  sortHeroesByGames,
  filterHeroesByName,
  mergeHeroStatsWithMetadata,
  createHeroWithStatsFromManualList,
  buildManualHeroList,
  HeroWithStats,
} from './heroStats';
import type { HeroStats, Hero } from '@/types';

// Test fixtures
const mockHeroes: Hero[] = [
  { id: 1, name: 'antimage', displayName: 'Anti-Mage', shortName: 'am' },
  { id: 2, name: 'axe', displayName: 'Axe', shortName: 'axe' },
  { id: 3, name: 'bane', displayName: 'Bane', shortName: 'bane' },
  { id: 4, name: 'bloodseeker', displayName: 'Bloodseeker', shortName: 'bs' },
  { id: 5, name: 'crystal_maiden', displayName: 'Crystal Maiden', shortName: 'cm' },
];

const mockStats: HeroStats[] = [
  { steamId: '123', heroId: 1, games: 60, wins: 35, avgImp: 100 },
  { steamId: '123', heroId: 2, games: 50, wins: 30, avgImp: 120 },
  { steamId: '123', heroId: 3, games: 100, wins: 60, avgImp: 80 },
];

describe('heroStats', () => {
  describe('calculateWinRate', () => {
    it('calculates 50% win rate correctly', () => {
      expect(calculateWinRate(50, 100)).toBe(50);
    });

    it('calculates 100% win rate', () => {
      expect(calculateWinRate(10, 10)).toBe(100);
    });

    it('calculates 0% win rate', () => {
      expect(calculateWinRate(0, 10)).toBe(0);
    });

    it('returns 0 for zero total games', () => {
      expect(calculateWinRate(0, 0)).toBe(0);
    });

    it('returns 0 for negative total games', () => {
      expect(calculateWinRate(5, -10)).toBe(0);
    });

    it('rounds to nearest integer', () => {
      expect(calculateWinRate(1, 3)).toBe(33); // 33.33... -> 33
      expect(calculateWinRate(2, 3)).toBe(67); // 66.66... -> 67
    });

    it('handles fractional wins', () => {
      expect(calculateWinRate(35, 60)).toBe(58); // 58.33... -> 58
    });
  });

  describe('sortHeroesByGames', () => {
    it('sorts heroes by total games descending', () => {
      const items: HeroWithStats[] = [
        { hero: mockHeroes[0], stat: mockStats[0], totalGames: 60 },
        { hero: mockHeroes[1], stat: mockStats[1], totalGames: 50 },
        { hero: mockHeroes[2], stat: mockStats[2], totalGames: 100 },
      ];

      const sorted = sortHeroesByGames(items);

      expect(sorted[0].totalGames).toBe(100);
      expect(sorted[1].totalGames).toBe(60);
      expect(sorted[2].totalGames).toBe(50);
    });

    it('returns new array without mutating original', () => {
      const items: HeroWithStats[] = [
        { hero: mockHeroes[0], stat: mockStats[0], totalGames: 10 },
        { hero: mockHeroes[1], stat: mockStats[1], totalGames: 50 },
      ];

      const sorted = sortHeroesByGames(items);

      expect(sorted).not.toBe(items);
      expect(items[0].totalGames).toBe(10); // Original unchanged
    });

    it('handles empty array', () => {
      expect(sortHeroesByGames([])).toEqual([]);
    });

    it('handles single item', () => {
      const items: HeroWithStats[] = [
        { hero: mockHeroes[0], stat: mockStats[0], totalGames: 60 },
      ];
      const sorted = sortHeroesByGames(items);
      expect(sorted).toHaveLength(1);
      expect(sorted[0].totalGames).toBe(60);
    });
  });

  describe('filterHeroesByName', () => {
    const items: HeroWithStats[] = [
      { hero: mockHeroes[0], stat: mockStats[0], totalGames: 60 }, // Anti-Mage
      { hero: mockHeroes[1], stat: mockStats[1], totalGames: 50 }, // Axe
      { hero: mockHeroes[2], stat: mockStats[2], totalGames: 100 }, // Bane
    ];

    it('filters by displayName prefix', () => {
      const filtered = filterHeroesByName(items, 'Anti');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].hero.displayName).toBe('Anti-Mage');
    });

    it('filters by internal name prefix', () => {
      const filtered = filterHeroesByName(items, 'anti');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].hero.name).toBe('antimage');
    });

    it('is case-insensitive', () => {
      const filtered = filterHeroesByName(items, 'ANTI');
      expect(filtered).toHaveLength(1);
    });

    it('returns all items for empty search', () => {
      expect(filterHeroesByName(items, '')).toHaveLength(3);
    });

    it('returns all items for whitespace-only search', () => {
      expect(filterHeroesByName(items, '   ')).toHaveLength(3);
    });

    it('returns empty for no matches', () => {
      expect(filterHeroesByName(items, 'Zeus')).toHaveLength(0);
    });

    it('filters multiple matches', () => {
      const filtered = filterHeroesByName(items, 'A');
      expect(filtered).toHaveLength(2); // Anti-Mage, Axe
    });

    it('does not match substrings (prefix-only)', () => {
      const filtered = filterHeroesByName(items, 'Mage');
      expect(filtered).toHaveLength(0);
    });
  });

  describe('mergeHeroStatsWithMetadata', () => {
    it('merges stats with hero metadata', () => {
      const result = mergeHeroStatsWithMetadata(mockStats, mockHeroes);

      expect(result).toHaveLength(3);
      expect(result[0].hero.displayName).toBe('Anti-Mage');
      expect(result[0].stat.games).toBe(60);
      expect(result[0].totalGames).toBe(60);
    });

    it('calculates totalGames correctly', () => {
      const result = mergeHeroStatsWithMetadata(mockStats, mockHeroes);

      expect(result[0].totalGames).toBe(60);
      expect(result[1].totalGames).toBe(50);
      expect(result[2].totalGames).toBe(100);
    });

    it('filters out stats with no matching hero', () => {
      const statsWithUnknown: HeroStats[] = [
        ...mockStats,
        { steamId: '123', heroId: 999, games: 15, wins: 5, avgImp: 0 },
      ];

      const result = mergeHeroStatsWithMetadata(statsWithUnknown, mockHeroes);
      expect(result).toHaveLength(3); // Unknown hero filtered out
    });

    it('handles empty stats array', () => {
      expect(mergeHeroStatsWithMetadata([], mockHeroes)).toEqual([]);
    });

    it('handles empty heroes array', () => {
      expect(mergeHeroStatsWithMetadata(mockStats, [])).toEqual([]);
    });

    it('handles null/undefined gracefully', () => {
      expect(mergeHeroStatsWithMetadata(null as unknown as HeroStats[], mockHeroes)).toEqual([]);
      expect(mergeHeroStatsWithMetadata(mockStats, null as unknown as Hero[])).toEqual([]);
    });

    it('filters out invalid stats entries', () => {
      const statsWithInvalid = [
        ...mockStats,
        { steamId: '123', heroId: null as unknown as number, games: 15, wins: 5, avgImp: 0 },
      ];

      const result = mergeHeroStatsWithMetadata(statsWithInvalid, mockHeroes);
      expect(result).toHaveLength(3);
    });
  });

  describe('createHeroWithStatsFromManualList', () => {
    it('creates HeroWithStats for valid hero ID', () => {
      const result = createHeroWithStatsFromManualList(1, '123', mockHeroes);

      expect(result).not.toBeNull();
      expect(result!.hero.displayName).toBe('Anti-Mage');
      expect(result!.totalGames).toBe(0);
    });

    it('uses existing stats if provided', () => {
      const result = createHeroWithStatsFromManualList(1, '123', mockHeroes, mockStats);

      expect(result).not.toBeNull();
      expect(result!.stat.games).toBe(60);
      expect(result!.totalGames).toBe(60);
    });

    it('returns null for unknown hero ID', () => {
      const result = createHeroWithStatsFromManualList(999, '123', mockHeroes);
      expect(result).toBeNull();
    });

    it('creates default stats when no existing stats', () => {
      const result = createHeroWithStatsFromManualList(4, '123', mockHeroes); // Bloodseeker - no stats

      expect(result).not.toBeNull();
      expect(result!.stat.games).toBe(0);
      expect(result!.stat.wins).toBe(0);
      expect(result!.stat.avgImp).toBe(0);
    });
  });

  describe('buildManualHeroList', () => {
    it('builds list preserving order', () => {
      const heroIds = [3, 1, 2]; // Bane, Anti-Mage, Axe
      const result = buildManualHeroList(heroIds, '123', mockHeroes);

      expect(result).toHaveLength(3);
      expect(result[0].hero.displayName).toBe('Bane');
      expect(result[1].hero.displayName).toBe('Anti-Mage');
      expect(result[2].hero.displayName).toBe('Axe');
    });

    it('includes stats when provided', () => {
      const heroIds = [1, 2];
      const result = buildManualHeroList(heroIds, '123', mockHeroes, mockStats);

      expect(result[0].totalGames).toBe(60); // Anti-Mage stats
      expect(result[1].totalGames).toBe(50); // Axe stats
    });

    it('filters out unknown hero IDs', () => {
      const heroIds = [1, 999, 2];
      const result = buildManualHeroList(heroIds, '123', mockHeroes);

      expect(result).toHaveLength(2);
    });

    it('handles empty array', () => {
      expect(buildManualHeroList([], '123', mockHeroes)).toEqual([]);
    });

    it('handles null/undefined', () => {
      expect(buildManualHeroList(null as unknown as number[], '123', mockHeroes)).toEqual([]);
      expect(buildManualHeroList(undefined as unknown as number[], '123', mockHeroes)).toEqual([]);
    });
  });
});
