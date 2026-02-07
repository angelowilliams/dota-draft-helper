import { db } from './database';
import type { Team } from '../types';

export async function createTeam(team: Omit<Team, 'id' | 'createdAt'>): Promise<string> {
  const newTeam: Team = {
    ...team,
    id: crypto.randomUUID(),
    createdAt: new Date(),
  };

  await db.teams.add(newTeam);
  return newTeam.id;
}

export async function updateTeam(id: string, updates: Partial<Omit<Team, 'id' | 'createdAt'>>): Promise<void> {
  await db.teams.update(id, {
    ...updates,
    lastUpdated: new Date(),
  });
}

export async function deleteTeam(id: string): Promise<void> {
  await db.teams.delete(id);
}

export async function getTeam(id: string): Promise<Team | undefined> {
  return db.teams.get(id);
}

export async function getAllTeams(): Promise<Team[]> {
  const teams = await db.teams.orderBy('createdAt').reverse().toArray();
  return teams.sort((a, b) => {
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return 0;
  });
}

export async function getTeamByName(name: string): Promise<Team | undefined> {
  return db.teams.where('name').equals(name).first();
}

export async function toggleFavorite(id: string): Promise<void> {
  const team = await db.teams.get(id);
  if (!team) return;

  const newFavorite = team.favorite ? undefined : 1;

  await db.transaction('rw', db.teams, async () => {
    if (newFavorite) {
      // Unfavorite all other teams first (limit to 1 favorite)
      await db.teams.where('favorite').equals(1).modify({ favorite: undefined });
    }
    await db.teams.update(id, {
      favorite: newFavorite,
      lastUpdated: new Date(),
    });
  });
}

export async function getFavoriteTeam(): Promise<Team | null> {
  const team = await db.teams.where('favorite').equals(1).first();
  return team ?? null;
}

export async function updateManualHeroLists(id: string, manualHeroLists: number[][]): Promise<void> {
  await db.teams.update(id, {
    manualHeroLists,
    lastUpdated: new Date(),
  });
}
