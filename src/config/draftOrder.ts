// Dota 2 Captain's Mode Draft Order Configuration

export interface DraftPhase {
  phase: number;
  type: 'ban' | 'pick';
  team: 'firstPick' | 'secondPick';
  order: number; // Overall order in the draft (1-based for display)
}

/**
 * Standard Dota 2 Captain's Mode Draft Order (Chronological)
 *
 * FP = First Pick, SP = Second Pick
 *
 * Phase 1 (bans 1-7, picks 8-9):
 *   FP ban, FP ban, SP ban, SP ban, FP ban, SP ban, SP ban, FP pick, SP pick
 * Phase 2 (bans 10-12, picks 13-18):
 *   FP ban, FP ban, SP ban, SP pick, FP pick, FP pick, SP pick, SP pick, FP pick
 * Phase 3 (bans 19-22, picks 23-24):
 *   FP ban, SP ban, FP ban, SP ban, FP pick, SP pick
 *
 * Total: 12 bans (6 per team), 10 picks (5 per team)
 */
export const CAPTAIN_MODE_DRAFT_ORDER: DraftPhase[] = [
  // Phase 1 (9 actions: 7 bans, 2 picks)
  { phase: 1, type: 'ban', team: 'firstPick', order: 1 },
  { phase: 1, type: 'ban', team: 'firstPick', order: 2 },
  { phase: 1, type: 'ban', team: 'secondPick', order: 3 },
  { phase: 1, type: 'ban', team: 'secondPick', order: 4 },
  { phase: 1, type: 'ban', team: 'firstPick', order: 5 },
  { phase: 1, type: 'ban', team: 'secondPick', order: 6 },
  { phase: 1, type: 'ban', team: 'secondPick', order: 7 },
  { phase: 1, type: 'pick', team: 'firstPick', order: 8 },
  { phase: 1, type: 'pick', team: 'secondPick', order: 9 },

  // Phase 2 (9 actions: 3 bans, 6 picks)
  { phase: 2, type: 'ban', team: 'firstPick', order: 10 },
  { phase: 2, type: 'ban', team: 'firstPick', order: 11 },
  { phase: 2, type: 'ban', team: 'secondPick', order: 12 },
  { phase: 2, type: 'pick', team: 'secondPick', order: 13 },
  { phase: 2, type: 'pick', team: 'firstPick', order: 14 },
  { phase: 2, type: 'pick', team: 'firstPick', order: 15 },
  { phase: 2, type: 'pick', team: 'secondPick', order: 16 },
  { phase: 2, type: 'pick', team: 'secondPick', order: 17 },
  { phase: 2, type: 'pick', team: 'firstPick', order: 18 },

  // Phase 3 (6 actions: 4 bans, 2 picks)
  { phase: 3, type: 'ban', team: 'firstPick', order: 19 },
  { phase: 3, type: 'ban', team: 'secondPick', order: 20 },
  { phase: 3, type: 'ban', team: 'firstPick', order: 21 },
  { phase: 3, type: 'ban', team: 'secondPick', order: 22 },
  { phase: 3, type: 'pick', team: 'firstPick', order: 23 },
  { phase: 3, type: 'pick', team: 'secondPick', order: 24 },
];

/**
 * Determines which team had first pick based on the draft data
 * First pick team is the one that made the first ban
 */
export function determineFirstPickTeam(
  radiantBans: number[],
  direBans: number[]
): 'radiant' | 'dire' {
  // The first two bans belong to first pick team
  // We need to check the match data's pickBans array order field to determine this
  // For now, we'll assume Radiant has first pick if they have more early bans
  // This will be overridden by the actual data in DraftDisplay
  return radiantBans.length >= direBans.length ? 'radiant' : 'dire';
}
