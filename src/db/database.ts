import Dexie, { Table } from 'dexie';
import type { Team, Player, HeroStats, Match, Hero, PlayerMatch } from '../types';

export class DotaDraftDatabase extends Dexie {
  teams!: Table<Team, string>;
  players!: Table<Player, string>;
  heroStats!: Table<HeroStats, [string, number, string]>;
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

    // Version 4: Recreate heroStats with new primary key structure
    // Add compound index for [steamId+lobbyTypeFilter] for efficient filtering
    this.version(4).stores({
      teams: 'id, name, *playerIds, teamId, yourTeam, createdAt',
      players: 'steamId, name, lastUpdated',
      heroStats: '[steamId+heroId+lobbyTypeFilter], [steamId+lobbyTypeFilter], steamId, heroId, lobbyTypeFilter, lastPlayed',
      matches: 'matchId, teamId, startDateTime, leagueId',
      heroes: 'id, name, displayName, shortName',
    });

    // Version 5: Add playerMatches table for storing raw match data
    // This enables client-side filtering by time window without re-fetching
    // Primary key is [steamId+matchId] since same match can have multiple tracked players
    this.version(5).stores({
      teams: 'id, name, *playerIds, teamId, yourTeam, createdAt',
      players: 'steamId, name, lastUpdated',
      heroStats: '[steamId+heroId+lobbyTypeFilter], [steamId+lobbyTypeFilter], steamId, heroId, lobbyTypeFilter, lastPlayed',
      matches: 'matchId, teamId, startDateTime, leagueId',
      heroes: 'id, name, displayName, shortName',
      playerMatches: '[steamId+matchId], steamId, startDateTime, heroId, lobbyType',
    });
  }
}

export const db = new DotaDraftDatabase();
