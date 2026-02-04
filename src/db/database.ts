import Dexie, { Table } from 'dexie';
import type { Team, Player, HeroStats, Match, Hero } from '../types';

export class DotaDraftDatabase extends Dexie {
  teams!: Table<Team, string>;
  players!: Table<Player, string>;
  heroStats!: Table<HeroStats, [string, number, string]>;
  matches!: Table<Match, string>;
  heroes!: Table<Hero, number>;

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
  }
}

export const db = new DotaDraftDatabase();
