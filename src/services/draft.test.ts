import { describe, it, expect } from 'vitest';
import {
  analyzeDraftState,
  isHeroAvailable,
  getNextEmptyCell,
  getEmptyCells,
  getTeamActions,
  serializeDraftState,
  deserializeDraftState,
  selectHeroInDraft,
  createEmptyDraftState,
} from './draft';
import { CAPTAIN_MODE_DRAFT_ORDER } from '@/config/draftOrder';

describe('draft', () => {
  describe('analyzeDraftState', () => {
    it('returns empty sets for empty draft', () => {
      const draftState = new Map<number, number>();
      const analysis = analyzeDraftState(draftState);

      expect(analysis.bannedHeroIds.size).toBe(0);
      expect(analysis.firstPickPickedHeroIds.size).toBe(0);
      expect(analysis.secondPickPickedHeroIds.size).toBe(0);
      expect(analysis.completedActions).toBe(0);
      expect(analysis.totalActions).toBe(24);
    });

    it('correctly identifies bans', () => {
      const draftState = new Map<number, number>();
      // Orders 1, 2 are firstPick bans
      draftState.set(1, 101); // Hero ID 101 banned
      draftState.set(2, 102); // Hero ID 102 banned

      const analysis = analyzeDraftState(draftState);

      expect(analysis.bannedHeroIds.has(101)).toBe(true);
      expect(analysis.bannedHeroIds.has(102)).toBe(true);
      expect(analysis.bannedHeroIds.size).toBe(2);
    });

    it('correctly identifies first pick picks', () => {
      const draftState = new Map<number, number>();
      // Order 8 is firstPick's first pick
      draftState.set(8, 201);

      const analysis = analyzeDraftState(draftState);

      expect(analysis.firstPickPickedHeroIds.has(201)).toBe(true);
      expect(analysis.firstPickPickedHeroIds.size).toBe(1);
      expect(analysis.secondPickPickedHeroIds.size).toBe(0);
    });

    it('correctly identifies second pick picks', () => {
      const draftState = new Map<number, number>();
      // Order 9 is secondPick's first pick
      draftState.set(9, 301);

      const analysis = analyzeDraftState(draftState);

      expect(analysis.secondPickPickedHeroIds.has(301)).toBe(true);
      expect(analysis.secondPickPickedHeroIds.size).toBe(1);
      expect(analysis.firstPickPickedHeroIds.size).toBe(0);
    });

    it('counts completed actions correctly', () => {
      const draftState = new Map<number, number>();
      draftState.set(1, 101);
      draftState.set(2, 102);
      draftState.set(3, 103);

      const analysis = analyzeDraftState(draftState);

      expect(analysis.completedActions).toBe(3);
    });

    it('handles full draft', () => {
      const draftState = new Map<number, number>();
      // Fill all 24 slots
      for (let i = 1; i <= 24; i++) {
        draftState.set(i, i + 100);
      }

      const analysis = analyzeDraftState(draftState);

      expect(analysis.completedActions).toBe(24);
      expect(analysis.bannedHeroIds.size).toBe(14); // 14 bans total
      expect(analysis.firstPickPickedHeroIds.size).toBe(5);
      expect(analysis.secondPickPickedHeroIds.size).toBe(5);
    });
  });

  describe('isHeroAvailable', () => {
    it('returns true for available hero', () => {
      const draftState = new Map<number, number>();
      draftState.set(1, 101);

      expect(isHeroAvailable(102, draftState)).toBe(true);
    });

    it('returns false for selected hero', () => {
      const draftState = new Map<number, number>();
      draftState.set(1, 101);

      expect(isHeroAvailable(101, draftState)).toBe(false);
    });

    it('returns true for empty draft', () => {
      const draftState = new Map<number, number>();
      expect(isHeroAvailable(101, draftState)).toBe(true);
    });

    it('handles hero selected multiple times (shouldn\'t happen but safe)', () => {
      const draftState = new Map<number, number>();
      draftState.set(1, 101);
      draftState.set(2, 101); // Same hero in two slots

      expect(isHeroAvailable(101, draftState)).toBe(false);
    });
  });

  describe('getNextEmptyCell', () => {
    it('returns 1 for empty draft', () => {
      const draftState = new Map<number, number>();
      expect(getNextEmptyCell(draftState)).toBe(1);
    });

    it('returns next empty cell in order', () => {
      const draftState = new Map<number, number>();
      draftState.set(1, 101);
      draftState.set(2, 102);

      expect(getNextEmptyCell(draftState)).toBe(3);
    });

    it('returns null for full draft', () => {
      const draftState = new Map<number, number>();
      for (let i = 1; i <= 24; i++) {
        draftState.set(i, i + 100);
      }

      expect(getNextEmptyCell(draftState)).toBeNull();
    });

    it('finds gap in middle', () => {
      const draftState = new Map<number, number>();
      draftState.set(1, 101);
      draftState.set(3, 103); // Skipped 2

      expect(getNextEmptyCell(draftState)).toBe(2);
    });
  });

  describe('getEmptyCells', () => {
    it('returns all 24 cells for empty draft', () => {
      const draftState = new Map<number, number>();
      const empty = getEmptyCells(draftState);

      expect(empty).toHaveLength(24);
      expect(empty).toContain(1);
      expect(empty).toContain(24);
    });

    it('excludes filled cells', () => {
      const draftState = new Map<number, number>();
      draftState.set(1, 101);
      draftState.set(5, 105);

      const empty = getEmptyCells(draftState);

      expect(empty).toHaveLength(22);
      expect(empty).not.toContain(1);
      expect(empty).not.toContain(5);
    });

    it('returns empty array for full draft', () => {
      const draftState = new Map<number, number>();
      for (let i = 1; i <= 24; i++) {
        draftState.set(i, i + 100);
      }

      expect(getEmptyCells(draftState)).toHaveLength(0);
    });
  });

  describe('getTeamActions', () => {
    it('returns correct actions for firstPick', () => {
      const draftState = new Map<number, number>();
      draftState.set(1, 101);
      draftState.set(8, 108);

      const actions = getTeamActions(draftState, 'firstPick');

      // Count firstPick actions in the draft order
      const firstPickCount = CAPTAIN_MODE_DRAFT_ORDER.filter(p => p.team === 'firstPick').length;
      expect(actions).toHaveLength(firstPickCount);

      // Check specific actions
      const action1 = actions.find(a => a.order === 1);
      expect(action1?.heroId).toBe(101);

      const action8 = actions.find(a => a.order === 8);
      expect(action8?.heroId).toBe(108);
    });

    it('returns correct actions for secondPick', () => {
      const draftState = new Map<number, number>();
      draftState.set(3, 103);
      draftState.set(9, 109);

      const actions = getTeamActions(draftState, 'secondPick');

      const secondPickCount = CAPTAIN_MODE_DRAFT_ORDER.filter(p => p.team === 'secondPick').length;
      expect(actions).toHaveLength(secondPickCount);

      const action3 = actions.find(a => a.order === 3);
      expect(action3?.heroId).toBe(103);

      const action9 = actions.find(a => a.order === 9);
      expect(action9?.heroId).toBe(109);
    });

    it('returns null heroId for empty cells', () => {
      const draftState = new Map<number, number>();
      const actions = getTeamActions(draftState, 'firstPick');

      expect(actions.every(a => a.heroId === null)).toBe(true);
    });
  });

  describe('serializeDraftState', () => {
    it('serializes empty map', () => {
      const draftState = new Map<number, number>();
      expect(serializeDraftState(draftState)).toEqual({});
    });

    it('serializes map to object', () => {
      const draftState = new Map<number, number>();
      draftState.set(1, 101);
      draftState.set(5, 105);

      const serialized = serializeDraftState(draftState);

      expect(serialized[1]).toBe(101);
      expect(serialized[5]).toBe(105);
    });

    it('preserves all entries', () => {
      const draftState = new Map<number, number>();
      for (let i = 1; i <= 24; i++) {
        draftState.set(i, i + 100);
      }

      const serialized = serializeDraftState(draftState);

      expect(Object.keys(serialized)).toHaveLength(24);
    });
  });

  describe('deserializeDraftState', () => {
    it('deserializes empty object', () => {
      const map = deserializeDraftState({});
      expect(map.size).toBe(0);
    });

    it('deserializes object to map', () => {
      const data = { 1: 101, 5: 105 };
      const map = deserializeDraftState(data);

      expect(map.get(1)).toBe(101);
      expect(map.get(5)).toBe(105);
      expect(map.size).toBe(2);
    });

    it('round-trips correctly', () => {
      const original = new Map<number, number>();
      original.set(1, 101);
      original.set(8, 201);
      original.set(24, 301);

      const serialized = serializeDraftState(original);
      const deserialized = deserializeDraftState(serialized);

      expect(deserialized.get(1)).toBe(101);
      expect(deserialized.get(8)).toBe(201);
      expect(deserialized.get(24)).toBe(301);
      expect(deserialized.size).toBe(3);
    });

    it('handles string keys from JSON parse', () => {
      // JSON.parse converts keys to strings
      const data = { '1': 101, '5': 105 };
      const map = deserializeDraftState(data);

      expect(map.get(1)).toBe(101);
      expect(map.get(5)).toBe(105);
    });

    it('ignores invalid entries', () => {
      const data = { 1: 101, invalid: 999, 5: 'not a number' } as unknown as Record<number, number>;
      const map = deserializeDraftState(data);

      expect(map.get(1)).toBe(101);
      expect(map.size).toBe(1); // Only valid entry
    });
  });

  describe('selectHeroInDraft', () => {
    it('adds hero to empty draft', () => {
      const draftState = new Map<number, number>();
      const newState = selectHeroInDraft(draftState, 1, 101);

      expect(newState.get(1)).toBe(101);
      expect(newState.size).toBe(1);
    });

    it('does not mutate original map', () => {
      const draftState = new Map<number, number>();
      draftState.set(1, 101);

      const newState = selectHeroInDraft(draftState, 2, 102);

      expect(draftState.size).toBe(1); // Original unchanged
      expect(newState.size).toBe(2);
    });

    it('overwrites existing selection', () => {
      const draftState = new Map<number, number>();
      draftState.set(1, 101);

      const newState = selectHeroInDraft(draftState, 1, 201);

      expect(newState.get(1)).toBe(201);
    });
  });

  describe('createEmptyDraftState', () => {
    it('returns empty Map', () => {
      const state = createEmptyDraftState();
      expect(state).toBeInstanceOf(Map);
      expect(state.size).toBe(0);
    });

    it('returns new instance each time', () => {
      const state1 = createEmptyDraftState();
      const state2 = createEmptyDraftState();

      expect(state1).not.toBe(state2);
    });
  });
});
