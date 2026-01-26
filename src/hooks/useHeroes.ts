import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import type { Hero } from '@/types';
import { useEffect } from 'react';

export function useHeroes() {
  const heroes = useLiveQuery(() => db.heroes.toArray(), []);

  // Load heroes from JSON file if not in DB
  useEffect(() => {
    if (heroes && heroes.length === 0) {
      loadHeroesFromFile();
    }
  }, [heroes?.length]);

  const loadHeroesFromFile = async () => {
    try {
      const response = await fetch('/heroes/heroes.json');
      const heroData: Hero[] = await response.json();
      await db.heroes.bulkPut(heroData);
    } catch (error) {
      console.error('Failed to load heroes:', error);
    }
  };

  return {
    heroes: heroes || [],
    loading: heroes === undefined,
    getHeroById: (id: number) => heroes?.find((h) => h.id === id),
    getHeroByName: (name: string) => heroes?.find((h) => h.name === name),
  };
}
