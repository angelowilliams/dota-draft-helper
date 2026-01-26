import Dexie, { Table } from 'dexie';
import type { Team, Player, HeroStats, Match, Hero } from '../types';

export class DotaDraftDatabase extends Dexie {
  teams!: Table<Team, string>;
  players!: Table<Player, string>;
  heroStats!: Table<HeroStats, [string, number]>;
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
  }
}

export const db = new DotaDraftDatabase();
