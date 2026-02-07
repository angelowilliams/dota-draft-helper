import { CAPTAIN_MODE_DRAFT_ORDER } from '@/config/draftOrder';

export interface DraftAnalysis {
  bannedHeroIds: Set<number>;
  firstPickPickedHeroIds: Set<number>;
  secondPickPickedHeroIds: Set<number>;
  completedActions: number;
  totalActions: number;
}

/**
 * Analyzes the current draft state and returns sets of banned/picked hero IDs
 */
export function analyzeDraftState(draftState: Map<number, number>): DraftAnalysis {
  const bannedHeroIds = new Set<number>();
  const firstPickPickedHeroIds = new Set<number>();
  const secondPickPickedHeroIds = new Set<number>();
  let completedActions = 0;

  CAPTAIN_MODE_DRAFT_ORDER.forEach((phase) => {
    const heroId = draftState.get(phase.order);

    if (heroId) {
      completedActions++;
      if (phase.type === 'ban') {
        bannedHeroIds.add(heroId);
      } else if (phase.type === 'pick') {
        if (phase.team === 'firstPick') {
          firstPickPickedHeroIds.add(heroId);
        } else {
          secondPickPickedHeroIds.add(heroId);
        }
      }
    }
  });

  return {
    bannedHeroIds,
    firstPickPickedHeroIds,
    secondPickPickedHeroIds,
    completedActions,
    totalActions: CAPTAIN_MODE_DRAFT_ORDER.length,
  };
}

/**
 * Checks if a hero is available (not banned or picked)
 */
export function isHeroAvailable(heroId: number, draftState: Map<number, number>): boolean {
  const selectedHeroIds = new Set(Array.from(draftState.values()));
  return !selectedHeroIds.has(heroId);
}

/**
 * Gets the next empty cell in draft order
 */
export function getNextEmptyCell(draftState: Map<number, number>): number | null {
  for (const phase of CAPTAIN_MODE_DRAFT_ORDER) {
    if (!draftState.has(phase.order)) {
      return phase.order;
    }
  }
  return null;
}

/**
 * Gets all empty cells in the draft
 */
export function getEmptyCells(draftState: Map<number, number>): number[] {
  return CAPTAIN_MODE_DRAFT_ORDER
    .filter((phase) => !draftState.has(phase.order))
    .map((phase) => phase.order);
}

/**
 * Gets actions for a specific team
 */
export function getTeamActions(
  draftState: Map<number, number>,
  team: 'firstPick' | 'secondPick'
): Array<{ order: number; heroId: number | null }> {
  return CAPTAIN_MODE_DRAFT_ORDER
    .filter((phase) => phase.team === team)
    .map((phase) => ({
      order: phase.order,
      heroId: draftState.get(phase.order) || null,
    }));
}

/**
 * Serializes draft state Map to plain object for storage/transmission
 */
export function serializeDraftState(draftState: Map<number, number>): Record<number, number> {
  const result: Record<number, number> = {};
  draftState.forEach((heroId, order) => {
    result[order] = heroId;
  });
  return result;
}

/**
 * Deserializes plain object back to draft state Map
 */
export function deserializeDraftState(data: Record<number, number>): Map<number, number> {
  const map = new Map<number, number>();
  for (const [key, value] of Object.entries(data)) {
    const order = parseInt(key, 10);
    if (!isNaN(order) && typeof value === 'number') {
      map.set(order, value);
    }
  }
  return map;
}

/**
 * Creates a new draft state with a hero selected at a specific cell
 */
export function selectHeroInDraft(
  draftState: Map<number, number>,
  cell: number,
  heroId: number
): Map<number, number> {
  const newState = new Map(draftState);
  newState.set(cell, heroId);
  return newState;
}

/**
 * Creates an empty draft state
 */
export function createEmptyDraftState(): Map<number, number> {
  return new Map();
}
