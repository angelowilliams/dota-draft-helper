// Core types for the application

export interface Team {
  id: string; // UUID generated locally
  name: string;
  playerIds: string[]; // Array of 5 Steam IDs
  teamId?: string; // Optional STRATZ team ID for competitive tracking
  teamLogo?: string; // Team logo URL from STRATZ
  yourTeam?: number; // Flag for "Your Team" (1 = true, undefined = false)
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
  lobbyType: number; // 0=unranked, 1=competitive, 7=ranked
  startDateTime: number; // Unix timestamp (seconds)
}

export interface HeroStats {
  steamId: string;
  heroId: number;
  lobbyTypeFilter: LobbyTypeFilter; // Which filter was used when fetching this data
  pubGames: number;
  competitiveGames: number;
  wins?: number;
  avgImp?: number;
  lastPlayed?: Date;
}

export interface Match {
  matchId: string;
  teamId?: string;
  startDateTime: Date;
  didRadiantWin: boolean;
  radiantTeamId?: number;
  direTeamId?: number;
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

// STRATZ API response types
export interface StratzPlayer {
  steamAccount: {
    id: string;
    name: string;
    avatar: string;
    proSteamAccount?: {
      name: string;
    };
  };
}

export interface StratzMatch {
  id: string;
  startDateTime: number;
  didRadiantWin: boolean;
  league?: {
    id: number;
    displayName: string;
  };
  pickBans?: Array<{
    heroId: number;
    isPick: boolean;
    isRadiant: boolean;
    order: number;
  }>;
}
