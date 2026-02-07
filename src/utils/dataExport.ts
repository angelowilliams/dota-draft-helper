import { db } from '@/db/database';
import type { Team, Player, Match, Hero, PlayerMatch } from '@/types';

export interface ExportData {
  version: number;
  exportedAt: string;
  teams: Team[];
  players: Player[];
  playerMatches: PlayerMatch[];
  matches: Match[];
  heroes: Hero[];
}

/**
 * Export all data from IndexedDB as a JSON file
 */
export async function exportAllData(): Promise<void> {
  const [teams, players, playerMatches, matches, heroes] = await Promise.all([
    db.teams.toArray(),
    db.players.toArray(),
    db.playerMatches.toArray(),
    db.matches.toArray(),
    db.heroes.toArray(),
  ]);

  const exportData: ExportData = {
    version: 2,
    exportedAt: new Date().toISOString(),
    teams,
    players,
    playerMatches,
    matches,
    heroes,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `dota-draft-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import data from a JSON file, completely replacing existing data
 */
export async function importAllData(file: File): Promise<void> {
  const text = await file.text();
  const data: ExportData = JSON.parse(text);

  // Validate data structure
  if (!data.version || !Array.isArray(data.teams)) {
    throw new Error('Invalid import file format');
  }

  // Clear all existing data
  await Promise.all([
    db.teams.clear(),
    db.players.clear(),
    db.playerMatches.clear(),
    db.matches.clear(),
    db.heroes.clear(),
  ]);

  // Import new data
  const playerMatches = data.playerMatches || [];
  await Promise.all([
    data.teams.length > 0 ? db.teams.bulkAdd(data.teams) : Promise.resolve(),
    data.players.length > 0 ? db.players.bulkAdd(data.players) : Promise.resolve(),
    playerMatches.length > 0 ? db.playerMatches.bulkAdd(playerMatches) : Promise.resolve(),
    data.matches.length > 0 ? db.matches.bulkAdd(data.matches) : Promise.resolve(),
    data.heroes.length > 0 ? db.heroes.bulkAdd(data.heroes) : Promise.resolve(),
  ]);
}
