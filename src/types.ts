// Core types for the application

export interface Team {
  id: string; // UUID generated locally
  name: string;
  playerIds: string[]; // Array of 5 Steam IDs
  teamId?: string; // Optional team ID for competitive tracking
  teamLogo?: string; // Team logo URL
  favorite?: number; // 1 = favorite, undefined = not
  manualHeroLists?: number[][]; // 5 arrays of hero IDs, one per player (ordered)
  createdAt: Date;
  lastUpdated?: Date;
}

export interface Player {
  steamId: string;
  name?: string;
  avatarUrl?: string;
  lastUpdated?: Date;
}

export type LobbyTypeFilter = 'all' | 'competitive';
export type TimeWindowFilter = 'month' | 'threeMonths' | 'year';

// Raw match data stored per player for client-side filtering
export interface PlayerMatch {
  matchId: string;
  steamId: string;
  heroId: number;
  isWin: boolean;
  imp: number | null;
  lobbyType: number; // 0=normal, 1=practice, 2=tournament, 7=ranked
  startDateTime: number; // Unix timestamp (seconds)
}

export interface HeroStats {
  steamId: string;
  heroId: number;
  games: number;
  wins: number;
  avgImp: number;
}

export interface Match {
  matchId: string;
  teamId?: string;
  startDateTime: Date;
  didRadiantWin: boolean;
  radiantTeamId?: number;
  direTeamId?: number;
  radiantTeamName?: string;
  direTeamName?: string;
  radiantDraft: Draft;
  direDraft: Draft;
  pickBans?: PickBan[]; // Raw pick/ban data with order
  leagueName?: string;
  leagueId?: number;
}

export interface PickBan {
  heroId: number;
  isPick: boolean;
  isRadiant: boolean;
  order: number;
}

export interface Draft {
  bans: number[]; // Hero IDs
  picks: number[]; // Hero IDs
}

export interface Hero {
  id: number;
  name: string;
  displayName: string;
  shortName: string;
}

export interface TeamData {
  team: Team;
  players: Player[];
  heroStats: HeroStats[];
  matches: Match[];
}

// Draft phase types
export type DraftPhase = 'ban' | 'pick';
export type TeamSide = 'radiant' | 'dire';

export interface DraftState {
  radiantTeam: Team | null;
  direTeam: Team | null;
  bannedHeroes: Set<number>;
  pickedHeroes: Map<number, TeamSide>; // heroId -> team that picked it
  currentPhase: DraftPhase;
}

// OpenDota API response types
export interface OpenDotaPlayer {
  profile: {
    account_id: number;
    personaname: string;
    name: string | null; // Pro player name
    avatarfull: string;
  };
}

export interface OpenDotaMatch {
  match_id: number;
  start_time: number;
  radiant_win: boolean;
  league?: {
    leagueid: number;
    name: string;
  };
  picks_bans?: Array<{
    hero_id: number;
    is_pick: boolean;
    team: number; // 0 = radiant, 1 = dire
    order: number;
  }>;
}
