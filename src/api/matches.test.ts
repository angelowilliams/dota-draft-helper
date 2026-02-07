import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db/database';
import { parseMatchDetail, findCompetitiveMatchIdsFromPlayers } from './matches';

describe('parseMatchDetail', () => {
  it('parses a match with picks and bans', () => {
    const result = parseMatchDetail({
      match_id: 123,
      start_time: 1700000000,
      radiant_win: true,
      radiant_team_id: 10,
      dire_team_id: 20,
      radiant_team: { team_id: 10, name: 'Team A' },
      dire_team: { team_id: 20, name: 'Team B' },
      league: { name: 'The International', leagueid: 99 },
      picks_bans: [
        { hero_id: 1, is_pick: false, team: 0, order: 0 },
        { hero_id: 2, is_pick: false, team: 1, order: 1 },
        { hero_id: 3, is_pick: true, team: 0, order: 2 },
        { hero_id: 4, is_pick: true, team: 1, order: 3 },
      ],
    });

    expect(result.matchId).toBe('123');
    expect(result.startDateTime).toEqual(new Date(1700000000 * 1000));
    expect(result.didRadiantWin).toBe(true);
    expect(result.radiantTeamId).toBe(10);
    expect(result.direTeamId).toBe(20);
    expect(result.radiantTeamName).toBe('Team A');
    expect(result.direTeamName).toBe('Team B');
    expect(result.radiantDraft.bans).toEqual([1]);
    expect(result.radiantDraft.picks).toEqual([3]);
    expect(result.direDraft.bans).toEqual([2]);
    expect(result.direDraft.picks).toEqual([4]);
    expect(result.leagueName).toBe('The International');
    expect(result.leagueId).toBe(99);
  });

  it('sorts picks_bans by order', () => {
    const result = parseMatchDetail({
      match_id: 456,
      start_time: 1700000000,
      radiant_win: false,
      radiant_team_id: 10,
      dire_team_id: 20,
      picks_bans: [
        { hero_id: 99, is_pick: true, team: 1, order: 3 },
        { hero_id: 1, is_pick: false, team: 0, order: 0 },
        { hero_id: 50, is_pick: true, team: 0, order: 2 },
        { hero_id: 2, is_pick: false, team: 1, order: 1 },
      ],
    });

    expect(result.pickBans).toEqual([
      { heroId: 1, isPick: false, isRadiant: true, order: 0 },
      { heroId: 2, isPick: false, isRadiant: false, order: 1 },
      { heroId: 50, isPick: true, isRadiant: true, order: 2 },
      { heroId: 99, isPick: true, isRadiant: false, order: 3 },
    ]);
  });

  it('handles missing picks_bans', () => {
    const result = parseMatchDetail({
      match_id: 789,
      start_time: 1700000000,
      radiant_win: true,
      radiant_team_id: 10,
      dire_team_id: 20,
    });

    expect(result.radiantDraft).toEqual({ bans: [], picks: [] });
    expect(result.direDraft).toEqual({ bans: [], picks: [] });
    expect(result.pickBans).toEqual([]);
  });

  it('falls back to radiant_name/dire_name when team objects are missing', () => {
    const result = parseMatchDetail({
      match_id: 101,
      start_time: 1700000000,
      radiant_win: false,
      radiant_team_id: 10,
      dire_team_id: 20,
      radiant_name: 'Rad Fallback',
      dire_name: 'Dire Fallback',
    });

    expect(result.radiantTeamName).toBe('Rad Fallback');
    expect(result.direTeamName).toBe('Dire Fallback');
  });
});

describe('findCompetitiveMatchIdsFromPlayers', () => {
  beforeEach(async () => {
    await db.playerMatches.clear();
  });

  it('returns matches where 3+ players participated in competitive lobbies', async () => {
    // 3 players in the same tournament match
    await db.playerMatches.bulkAdd([
      { matchId: '100', steamId: 'p1', heroId: 1, isWin: true, imp: null, lobbyType: 2, startDateTime: 1000 },
      { matchId: '100', steamId: 'p2', heroId: 2, isWin: true, imp: null, lobbyType: 2, startDateTime: 1000 },
      { matchId: '100', steamId: 'p3', heroId: 3, isWin: true, imp: null, lobbyType: 2, startDateTime: 1000 },
      // Only 2 players in this match — should be excluded
      { matchId: '200', steamId: 'p1', heroId: 1, isWin: false, imp: null, lobbyType: 2, startDateTime: 900 },
      { matchId: '200', steamId: 'p2', heroId: 2, isWin: false, imp: null, lobbyType: 2, startDateTime: 900 },
    ]);

    const result = await findCompetitiveMatchIdsFromPlayers(
      ['p1', 'p2', 'p3', 'p4', 'p5'],
      10
    );

    expect(result).toEqual(['100']);
  });

  it('excludes non-competitive lobby types', async () => {
    // 3 players but in a ranked match (lobbyType 7)
    await db.playerMatches.bulkAdd([
      { matchId: '300', steamId: 'p1', heroId: 1, isWin: true, imp: null, lobbyType: 7, startDateTime: 1000 },
      { matchId: '300', steamId: 'p2', heroId: 2, isWin: true, imp: null, lobbyType: 7, startDateTime: 1000 },
      { matchId: '300', steamId: 'p3', heroId: 3, isWin: true, imp: null, lobbyType: 7, startDateTime: 1000 },
    ]);

    const result = await findCompetitiveMatchIdsFromPlayers(
      ['p1', 'p2', 'p3'],
      10
    );

    expect(result).toEqual([]);
  });

  it('sorts by most recent first and respects limit', async () => {
    const players = ['p1', 'p2', 'p3'];
    // Insert 3 qualifying matches at different times
    for (const [matchId, time] of [['400', 500], ['401', 900], ['402', 700]] as const) {
      for (const pid of players) {
        await db.playerMatches.add({
          matchId, steamId: pid, heroId: 1, isWin: true, imp: null, lobbyType: 1, startDateTime: time,
        });
      }
    }

    const result = await findCompetitiveMatchIdsFromPlayers(players, 2);

    expect(result).toEqual(['401', '402']);
  });

  it('includes practice lobby (type 1) matches', async () => {
    await db.playerMatches.bulkAdd([
      { matchId: '500', steamId: 'p1', heroId: 1, isWin: true, imp: null, lobbyType: 1, startDateTime: 1000 },
      { matchId: '500', steamId: 'p2', heroId: 2, isWin: true, imp: null, lobbyType: 1, startDateTime: 1000 },
      { matchId: '500', steamId: 'p3', heroId: 3, isWin: true, imp: null, lobbyType: 1, startDateTime: 1000 },
    ]);

    const result = await findCompetitiveMatchIdsFromPlayers(
      ['p1', 'p2', 'p3'],
      10
    );

    expect(result).toEqual(['500']);
  });
});
