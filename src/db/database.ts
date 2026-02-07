import Dexie, { Table } from 'dexie';
import type { Team, Player, Match, Hero, PlayerMatch } from '../types';

export class DotaDraftDatabase extends Dexie {
  teams!: Table<Team, string>;
  players!: Table<Player, string>;
  matches!: Table<Match, string>;
  heroes!: Table<Hero, number>;
  playerMatches!: Table<PlayerMatch, string>;

  constructor() {
    super('DotaDraftHelper');

    this.version(1).stores({
      teams: 'id, name, *playerIds, teamId, createdAt',
      players: 'steamId, name, lastUpdated',
      heroStats: '[steamId+heroId], steamId, heroId, lastPlayed',
      matches: 'matchId, teamId, startDateTime, leagueId',
      heroes: 'id, name, displayName, shortName',
    });

    this.version(2).stores({
      teams: 'id, name, *playerIds, teamId, yourTeam, createdAt',
      players: 'steamId, name, lastUpdated',
      heroStats: '[steamId+heroId], steamId, heroId, lastPlayed',
      matches: 'matchId, teamId, startDateTime, leagueId',
      heroes: 'id, name, displayName, shortName',
    });

    // Version 3: Delete heroStats table (set to null)
    this.version(3).stores({
      teams: 'id, name, *playerIds, teamId, yourTeam, createdAt',
      players: 'steamId, name, lastUpdated',
      heroStats: null, // Delete the table
      matches: 'matchId, teamId, startDateTime, leagueId',
      heroes: 'id, name, displayName, shortName',
    });

    // Version 4: heroStats stays deleted (was deleted in v3)
    // Previously recreated with new PK, but that causes UpgradeError on fresh DBs
    this.version(4).stores({
      teams: 'id, name, *playerIds, teamId, yourTeam, createdAt',
      players: 'steamId, name, lastUpdated',
      matches: 'matchId, teamId, startDateTime, leagueId',
      heroes: 'id, name, displayName, shortName',
    });

    // Version 5: Add playerMatches table for storing raw match data
    // This enables client-side filtering by time window without re-fetching
    // Primary key is [steamId+matchId] since same match can have multiple tracked players
    this.version(5).stores({
      teams: 'id, name, *playerIds, teamId, yourTeam, createdAt',
      players: 'steamId, name, lastUpdated',
      matches: 'matchId, teamId, startDateTime, leagueId',
      heroes: 'id, name, displayName, shortName',
      playerMatches: '[steamId+matchId], steamId, startDateTime, heroId, lobbyType',
    });

    // Version 6: Drop heroStats table (stats are now computed on-the-fly from playerMatches)
    this.version(6).stores({
      teams: 'id, name, *playerIds, teamId, yourTeam, createdAt',
      players: 'steamId, name, lastUpdated',
      heroStats: null,
      matches: 'matchId, teamId, startDateTime, leagueId',
      heroes: 'id, name, displayName, shortName',
      playerMatches: '[steamId+matchId], steamId, startDateTime, heroId, lobbyType',
    });
  }
}

export const db = new DotaDraftDatabase();
