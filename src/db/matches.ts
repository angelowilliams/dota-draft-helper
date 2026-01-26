import { db } from './database';
import type { Match } from '../types';

export async function saveMatches(matches: Match[]): Promise<void> {
  await db.matches.bulkPut(matches);
}

export async function getTeamMatches(teamId: string): Promise<Match[]> {
  return db.matches
    .where('teamId')
    .equals(teamId)
    .reverse()
    .sortBy('startDateTime');
}

export async function getMatchById(matchId: string): Promise<Match | undefined> {
  return db.matches.get(matchId);
}

export async function deleteTeamMatches(teamId: string): Promise<void> {
  await db.matches.where('teamId').equals(teamId).delete();
}
