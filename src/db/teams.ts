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

  // Also delete associated player data
  const team = await db.teams.get(id);
  if (team) {
    for (const steamId of team.playerIds) {
      await db.heroStats.where('steamId').equals(steamId).delete();
    }
  }
}

export async function getTeam(id: string): Promise<Team | undefined> {
  return db.teams.get(id);
}

export async function getAllTeams(): Promise<Team[]> {
  return db.teams.orderBy('createdAt').reverse().toArray();
}

export async function getTeamByName(name: string): Promise<Team | undefined> {
  return db.teams.where('name').equals(name).first();
}

export async function getYourTeam(): Promise<Team | undefined> {
  return db.teams.where('yourTeam').equals(1).first();
}

export async function getOtherTeams(): Promise<Team[]> {
  return db.teams
    .filter(team => !team.yourTeam)
    .toArray()
    .then(teams => teams.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
}

export async function setAsYourTeam(id: string): Promise<void> {
  // First, unset any existing "Your Team"
  const existingYourTeam = await getYourTeam();
  if (existingYourTeam && existingYourTeam.id !== id) {
    await db.teams.update(existingYourTeam.id, {
      yourTeam: undefined,
      manualHeroLists: undefined,
    });
  }

  // Set the new team as "Your Team" and initialize empty hero lists
  await db.teams.update(id, {
    yourTeam: 1,
    manualHeroLists: [[], [], [], [], []],
    lastUpdated: new Date(),
  });
}

export async function unsetYourTeam(id: string): Promise<void> {
  await db.teams.update(id, {
    yourTeam: undefined,
    manualHeroLists: undefined,
    lastUpdated: new Date(),
  });
}

export async function updateManualHeroLists(id: string, manualHeroLists: number[][]): Promise<void> {
  await db.teams.update(id, {
    manualHeroLists,
    lastUpdated: new Date(),
  });
}
