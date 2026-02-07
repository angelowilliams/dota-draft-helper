import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectTeamsForPlayers } from './teamDetection';

// Mock the API modules
vi.mock('@/api/players', () => ({
  fetchPlayerRecentLobbyMatches: vi.fn(),
}));

vi.mock('@/api/teams', () => ({
  fetchTeamInfo: vi.fn(),
}));

vi.mock('@/api/opendota', () => ({
  opendotaFetch: vi.fn(),
}));

import { fetchPlayerRecentLobbyMatches } from '@/api/players';
import { fetchTeamInfo } from '@/api/teams';
import { opendotaFetch } from '@/api/opendota';

const mockFetchLobbyMatches = vi.mocked(fetchPlayerRecentLobbyMatches);
const mockFetchTeamInfo = vi.mocked(fetchTeamInfo);
const mockOpendotaFetch = vi.mocked(opendotaFetch);

beforeEach(() => {
  vi.resetAllMocks();
});

describe('detectTeamsForPlayers', () => {
  it('returns "none" for empty player list', async () => {
    const result = await detectTeamsForPlayers([]);
    expect(result).toEqual({ candidates: [], status: 'none' });
  });

  it('returns "none" for null/undefined player list', async () => {
    const result = await detectTeamsForPlayers(null as unknown as string[]);
    expect(result).toEqual({ candidates: [], status: 'none' });
  });

  it('detects team from practice lobby matches when 3/5 players share a team', async () => {
    const playerIds = ['100', '200', '300', '400', '500'];

    // Players 100, 200, 300 have lobby matches; 400, 500 don't
    mockFetchLobbyMatches.mockImplementation(async (id: string) => {
      if (['100', '200', '300'].includes(id)) {
        return [{ match_id: 9001, player_slot: 0 }];
      }
      return [];
    });

    // Match 9001 has team_id 42 on radiant
    mockOpendotaFetch.mockImplementation(async (endpoint: string) => {
      if (endpoint.startsWith('/matches/9001')) {
        return {
          match_id: 9001,
          radiant_team_id: 42,
          dire_team_id: 99,
          radiant_team: { team_id: 42, name: 'Test Team', tag: 'TT', logo_url: 'https://logo.png' },
          dire_team: { team_id: 99, name: 'Other', tag: 'OT', logo_url: '' },
          players: [
            { account_id: 100, player_slot: 0 },
            { account_id: 200, player_slot: 1 },
            { account_id: 300, player_slot: 2 },
            { account_id: 600, player_slot: 3 },
            { account_id: 700, player_slot: 4 },
            { account_id: 800, player_slot: 128 },
            { account_id: 900, player_slot: 129 },
            { account_id: 1000, player_slot: 130 },
            { account_id: 1100, player_slot: 131 },
            { account_id: 1200, player_slot: 132 },
          ],
        };
      }
      return null;
    });

    mockFetchTeamInfo.mockResolvedValue({ id: 42, name: 'Test Team', tag: 'TT', logo: 'https://logo.png' });

    const result = await detectTeamsForPlayers(playerIds);

    expect(result.status).toBe('found');
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].teamId).toBe(42);
    expect(result.candidates[0].name).toBe('Test Team');
    expect(result.candidates[0].tag).toBe('TT');
    expect(result.candidates[0].matchingPlayers).toBe(3);
  });

  it('returns multiple candidates sorted by matching player count', async () => {
    const playerIds = ['100', '200', '300', '400', '500'];

    // Players 100, 200 play in match with team 42; players 300, 400, 500 play in match with team 55
    mockFetchLobbyMatches.mockImplementation(async (id: string) => {
      if (['100', '200'].includes(id)) {
        return [{ match_id: 9001, player_slot: 0 }];
      }
      if (['300', '400', '500'].includes(id)) {
        return [{ match_id: 9002, player_slot: 0 }];
      }
      return [];
    });

    mockOpendotaFetch.mockImplementation(async (endpoint: string) => {
      if (endpoint.startsWith('/matches/9001')) {
        return {
          match_id: 9001,
          radiant_team_id: 42,
          radiant_team: { team_id: 42, name: 'Team A', tag: 'TA', logo_url: '' },
          players: [
            { account_id: 100, player_slot: 0 },
            { account_id: 200, player_slot: 1 },
          ],
        };
      }
      if (endpoint.startsWith('/matches/9002')) {
        return {
          match_id: 9002,
          radiant_team_id: 55,
          radiant_team: { team_id: 55, name: 'Team B', tag: 'TB', logo_url: 'https://b.png' },
          players: [
            { account_id: 300, player_slot: 0 },
            { account_id: 400, player_slot: 1 },
            { account_id: 500, player_slot: 2 },
          ],
        };
      }
      return null;
    });

    mockFetchTeamInfo.mockImplementation(async (id: number) => {
      if (id === 42) return { id: 42, name: 'Team A', tag: 'TA', logo: 'https://a.png' };
      if (id === 55) return { id: 55, name: 'Team B', tag: 'TB', logo: 'https://b.png' };
      return null;
    });

    const result = await detectTeamsForPlayers(playerIds);

    expect(result.status).toBe('found');
    expect(result.candidates).toHaveLength(2);
    // Sorted by matchingPlayers descending
    expect(result.candidates[0].teamId).toBe(55);
    expect(result.candidates[0].matchingPlayers).toBe(3);
    expect(result.candidates[1].teamId).toBe(42);
    expect(result.candidates[1].matchingPlayers).toBe(2);
  });

  it('excludes teams with only 1 matching player', async () => {
    const playerIds = ['100', '200', '300'];

    // Each player has a different match with a different team
    mockFetchLobbyMatches.mockImplementation(async (id: string) => {
      return [{ match_id: Number(id) + 9000, player_slot: 0 }];
    });

    mockOpendotaFetch.mockImplementation(async (endpoint: string) => {
      if (endpoint.includes('9100')) {
        return {
          match_id: 9100,
          radiant_team_id: 10,
          radiant_team: { team_id: 10, name: 'Solo A', tag: 'SA', logo_url: '' },
          players: [{ account_id: 100, player_slot: 0 }],
        };
      }
      if (endpoint.includes('9200')) {
        return {
          match_id: 9200,
          radiant_team_id: 20,
          radiant_team: { team_id: 20, name: 'Solo B', tag: 'SB', logo_url: '' },
          players: [{ account_id: 200, player_slot: 0 }],
        };
      }
      if (endpoint.includes('9300')) {
        return {
          match_id: 9300,
          radiant_team_id: 30,
          radiant_team: { team_id: 30, name: 'Solo C', tag: 'SC', logo_url: '' },
          players: [{ account_id: 300, player_slot: 0 }],
        };
      }
      return null;
    });

    const result = await detectTeamsForPlayers(playerIds);

    expect(result.status).toBe('none');
    expect(result.candidates).toEqual([]);
  });

  it('returns "none" when no players have lobby matches', async () => {
    mockFetchLobbyMatches.mockResolvedValue([]);

    const result = await detectTeamsForPlayers(['100', '200', '300']);

    expect(result.status).toBe('none');
    expect(result.candidates).toEqual([]);
  });

  it('returns "none" when matches have no team data', async () => {
    mockFetchLobbyMatches.mockResolvedValue([
      { match_id: 9001, player_slot: 0 },
    ]);

    mockOpendotaFetch.mockResolvedValue({
      match_id: 9001,
      // No team IDs
      players: [{ account_id: 100, player_slot: 0 }],
    });

    const result = await detectTeamsForPlayers(['100', '200']);

    expect(result.status).toBe('none');
    expect(result.candidates).toEqual([]);
  });

  it('handles API errors gracefully and returns error status', async () => {
    mockFetchLobbyMatches.mockRejectedValue(new Error('Network error'));

    const result = await detectTeamsForPlayers(['100', '200']);

    // Individual player errors are caught, so this should return 'none' not 'error'
    // since the outer try/catch only catches unexpected failures
    expect(result.status).toBe('none');
    expect(result.candidates).toEqual([]);
  });

  it('handles match detail fetch failure gracefully', async () => {
    const playerIds = ['100', '200'];

    mockFetchLobbyMatches.mockResolvedValue([
      { match_id: 9001, player_slot: 0 },
    ]);

    // Match detail fails for all
    mockOpendotaFetch.mockRejectedValue(new Error('Match not found'));

    const result = await detectTeamsForPlayers(playerIds);

    expect(result.status).toBe('none');
    expect(result.candidates).toEqual([]);
  });

  it('correctly determines dire side for player_slot >= 128', async () => {
    const playerIds = ['100', '200'];

    mockFetchLobbyMatches.mockResolvedValue([
      { match_id: 9001, player_slot: 128 },
    ]);

    mockOpendotaFetch.mockResolvedValue({
      match_id: 9001,
      radiant_team_id: 10,
      dire_team_id: 42,
      radiant_team: { team_id: 10, name: 'Wrong Team', tag: 'WT', logo_url: '' },
      dire_team: { team_id: 42, name: 'Dire Team', tag: 'DT', logo_url: 'https://dire.png' },
      players: [
        { account_id: 100, player_slot: 128 },
        { account_id: 200, player_slot: 129 },
      ],
    });

    mockFetchTeamInfo.mockResolvedValue({ id: 42, name: 'Dire Team', tag: 'DT', logo: 'https://dire.png' });

    const result = await detectTeamsForPlayers(playerIds);

    expect(result.status).toBe('found');
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].teamId).toBe(42);
    expect(result.candidates[0].name).toBe('Dire Team');
  });

  it('fetches team info via fetchTeamInfo to get name, tag, and logo', async () => {
    const playerIds = ['100', '200'];

    mockFetchLobbyMatches.mockResolvedValue([
      { match_id: 9001, player_slot: 0 },
    ]);

    // Match detail has team_id but no team object (common for non-pro matches)
    mockOpendotaFetch.mockResolvedValue({
      match_id: 9001,
      radiant_team_id: 42,
      players: [
        { account_id: 100, player_slot: 0 },
        { account_id: 200, player_slot: 1 },
      ],
    });

    mockFetchTeamInfo.mockResolvedValue({
      id: 42,
      name: 'Real Team Name',
      tag: 'RTN',
      logo: 'https://fetched-logo.png',
    });

    const result = await detectTeamsForPlayers(playerIds);

    expect(result.status).toBe('found');
    expect(result.candidates[0].name).toBe('Real Team Name');
    expect(result.candidates[0].tag).toBe('RTN');
    expect(result.candidates[0].logoUrl).toBe('https://fetched-logo.png');
    expect(mockFetchTeamInfo).toHaveBeenCalledWith(42);
  });

  it('uses radiant_name/dire_name for amateur teams without team objects', async () => {
    const playerIds = ['100', '200'];

    mockFetchLobbyMatches.mockResolvedValue([
      { match_id: 9001, player_slot: 0 },
    ]);

    // Amateur practice lobby: has team IDs and radiant_name/dire_name but no team objects
    mockOpendotaFetch.mockResolvedValue({
      match_id: 9001,
      radiant_team_id: 9444389,
      dire_team_id: 10020352,
      radiant_name: 'Merrill Howard Kalin Fan Club',
      dire_name: 'High Ground Homies',
      players: [
        { account_id: 100, player_slot: 0 },
        { account_id: 200, player_slot: 1 },
      ],
    });

    // fetchTeamInfo returns null for amateur teams not in OpenDota DB
    mockFetchTeamInfo.mockResolvedValue(null);

    const result = await detectTeamsForPlayers(playerIds);

    expect(result.status).toBe('found');
    expect(result.candidates[0].teamId).toBe(9444389);
    expect(result.candidates[0].name).toBe('Merrill Howard Kalin Fan Club');
  });

  it('uses dire_name when player is on dire side without team object', async () => {
    const playerIds = ['100', '200'];

    mockFetchLobbyMatches.mockResolvedValue([
      { match_id: 9001, player_slot: 128 },
    ]);

    mockOpendotaFetch.mockResolvedValue({
      match_id: 9001,
      radiant_team_id: 10,
      dire_team_id: 42,
      radiant_name: 'Radiant Team Name',
      dire_name: 'Dire Team Name',
      players: [
        { account_id: 100, player_slot: 128 },
        { account_id: 200, player_slot: 129 },
      ],
    });

    mockFetchTeamInfo.mockResolvedValue(null);

    const result = await detectTeamsForPlayers(playerIds);

    expect(result.status).toBe('found');
    expect(result.candidates[0].teamId).toBe(42);
    expect(result.candidates[0].name).toBe('Dire Team Name');
  });
});
