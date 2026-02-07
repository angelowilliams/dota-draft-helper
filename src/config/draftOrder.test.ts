import { describe, it, expect } from 'vitest'
import { CAPTAIN_MODE_DRAFT_ORDER, DraftPhase } from './draftOrder'

describe('draftOrder', () => {
  describe('CAPTAIN_MODE_DRAFT_ORDER structure', () => {
    it('has exactly 24 actions', () => {
      expect(CAPTAIN_MODE_DRAFT_ORDER).toHaveLength(24)
    })

    it('has exactly 14 bans', () => {
      const bans = CAPTAIN_MODE_DRAFT_ORDER.filter(a => a.type === 'ban')
      expect(bans).toHaveLength(14)
    })

    it('has exactly 10 picks', () => {
      const picks = CAPTAIN_MODE_DRAFT_ORDER.filter(a => a.type === 'pick')
      expect(picks).toHaveLength(10)
    })

    it('has 7 bans for firstPick team', () => {
      const fpBans = CAPTAIN_MODE_DRAFT_ORDER.filter(
        a => a.type === 'ban' && a.team === 'firstPick'
      )
      expect(fpBans).toHaveLength(7)
    })

    it('has 7 bans for secondPick team', () => {
      const spBans = CAPTAIN_MODE_DRAFT_ORDER.filter(
        a => a.type === 'ban' && a.team === 'secondPick'
      )
      expect(spBans).toHaveLength(7)
    })

    it('has 5 picks for firstPick team', () => {
      const fpPicks = CAPTAIN_MODE_DRAFT_ORDER.filter(
        a => a.type === 'pick' && a.team === 'firstPick'
      )
      expect(fpPicks).toHaveLength(5)
    })

    it('has 5 picks for secondPick team', () => {
      const spPicks = CAPTAIN_MODE_DRAFT_ORDER.filter(
        a => a.type === 'pick' && a.team === 'secondPick'
      )
      expect(spPicks).toHaveLength(5)
    })
  })

  describe('order sequence', () => {
    it('has sequential order from 1 to 24', () => {
      const orders = CAPTAIN_MODE_DRAFT_ORDER.map(a => a.order)
      const expected = Array.from({ length: 24 }, (_, i) => i + 1)
      expect(orders).toEqual(expected)
    })

    it('starts with a firstPick ban', () => {
      const first = CAPTAIN_MODE_DRAFT_ORDER[0]
      expect(first.team).toBe('firstPick')
      expect(first.type).toBe('ban')
      expect(first.order).toBe(1)
    })

    it('has first two actions as firstPick bans', () => {
      expect(CAPTAIN_MODE_DRAFT_ORDER[0].team).toBe('firstPick')
      expect(CAPTAIN_MODE_DRAFT_ORDER[0].type).toBe('ban')
      expect(CAPTAIN_MODE_DRAFT_ORDER[1].team).toBe('firstPick')
      expect(CAPTAIN_MODE_DRAFT_ORDER[1].type).toBe('ban')
    })

    it('ends with secondPick pick at order 24', () => {
      const last = CAPTAIN_MODE_DRAFT_ORDER[23]
      expect(last.team).toBe('secondPick')
      expect(last.type).toBe('pick')
      expect(last.order).toBe(24)
    })
  })

  describe('phase structure', () => {
    it('phase 1 has 9 actions (7 bans, 2 picks)', () => {
      const phase1 = CAPTAIN_MODE_DRAFT_ORDER.filter(a => a.phase === 1)
      expect(phase1).toHaveLength(9)
      expect(phase1.filter(a => a.type === 'ban')).toHaveLength(7)
      expect(phase1.filter(a => a.type === 'pick')).toHaveLength(2)
    })

    it('phase 2 has 9 actions (3 bans, 6 picks)', () => {
      const phase2 = CAPTAIN_MODE_DRAFT_ORDER.filter(a => a.phase === 2)
      expect(phase2).toHaveLength(9)
      expect(phase2.filter(a => a.type === 'ban')).toHaveLength(3)
      expect(phase2.filter(a => a.type === 'pick')).toHaveLength(6)
    })

    it('phase 3 has 6 actions (4 bans, 2 picks)', () => {
      const phase3 = CAPTAIN_MODE_DRAFT_ORDER.filter(a => a.phase === 3)
      expect(phase3).toHaveLength(6)
      expect(phase3.filter(a => a.type === 'ban')).toHaveLength(4)
      expect(phase3.filter(a => a.type === 'pick')).toHaveLength(2)
    })
  })

  describe('specific action positions', () => {
    it('first pick (action 8) is by firstPick team', () => {
      const action8 = CAPTAIN_MODE_DRAFT_ORDER.find(a => a.order === 8)
      expect(action8?.type).toBe('pick')
      expect(action8?.team).toBe('firstPick')
    })

    it('second pick (action 9) is by secondPick team', () => {
      const action9 = CAPTAIN_MODE_DRAFT_ORDER.find(a => a.order === 9)
      expect(action9?.type).toBe('pick')
      expect(action9?.team).toBe('secondPick')
    })

    it('all actions have valid type and team', () => {
      CAPTAIN_MODE_DRAFT_ORDER.forEach((action: DraftPhase) => {
        expect(['ban', 'pick']).toContain(action.type)
        expect(['firstPick', 'secondPick']).toContain(action.team)
        expect(action.phase).toBeGreaterThanOrEqual(1)
        expect(action.phase).toBeLessThanOrEqual(3)
      })
    })
  })
})
