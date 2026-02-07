import { describe, it, expect } from 'vitest'
import {
  isValidSteamId32,
  isValidSteamId64,
  isValidSteamId,
  validateTeamForm,
} from './validation'

describe('validation', () => {
  describe('isValidSteamId32', () => {
    it('validates 8-digit Steam32 ID', () => {
      expect(isValidSteamId32('93712692')).toBe(true)
    })

    it('validates 9-digit Steam32 ID', () => {
      expect(isValidSteamId32('123456789')).toBe(true)
    })

    it('validates 10-digit Steam32 ID', () => {
      expect(isValidSteamId32('1234567890')).toBe(true)
    })

    it('validates 7-digit Steam32 ID', () => {
      expect(isValidSteamId32('1234567')).toBe(true)
    })

    it('rejects 6-digit ID as too short', () => {
      expect(isValidSteamId32('123456')).toBe(false)
    })

    it('rejects 11-digit ID as too long', () => {
      expect(isValidSteamId32('12345678901')).toBe(false)
    })

    it('rejects zero', () => {
      expect(isValidSteamId32('0')).toBe(false)
    })

    it('rejects negative number string', () => {
      expect(isValidSteamId32('-93712692')).toBe(false)
    })

    it('rejects non-numeric string', () => {
      expect(isValidSteamId32('abc12345')).toBe(false)
    })

    it('rejects empty string', () => {
      expect(isValidSteamId32('')).toBe(false)
    })

    it('rejects string with spaces', () => {
      expect(isValidSteamId32('9371 2692')).toBe(false)
    })
  })

  describe('isValidSteamId64', () => {
    it('validates Steam64 ID starting with 7656119', () => {
      expect(isValidSteamId64('76561198053978420')).toBe(true)
    })

    it('validates another Steam64 ID', () => {
      expect(isValidSteamId64('76561198047541078')).toBe(true)
    })

    it('rejects 17 digits not starting with 7656119', () => {
      expect(isValidSteamId64('12345678901234567')).toBe(false)
    })

    it('rejects 16 digit number', () => {
      expect(isValidSteamId64('7656119805397842')).toBe(false)
    })

    it('rejects 18 digit number', () => {
      expect(isValidSteamId64('765611980539784201')).toBe(false)
    })

    it('rejects Steam32 ID', () => {
      expect(isValidSteamId64('93712692')).toBe(false)
    })

    it('rejects empty string', () => {
      expect(isValidSteamId64('')).toBe(false)
    })

    it('rejects non-numeric string', () => {
      expect(isValidSteamId64('7656119805397842a')).toBe(false)
    })
  })

  describe('isValidSteamId', () => {
    it('accepts valid Steam32 ID', () => {
      expect(isValidSteamId('93712692')).toBe(true)
    })

    it('accepts valid Steam64 ID', () => {
      expect(isValidSteamId('76561198053978420')).toBe(true)
    })

    it('rejects invalid ID', () => {
      expect(isValidSteamId('123')).toBe(false)
    })

    it('rejects empty string', () => {
      expect(isValidSteamId('')).toBe(false)
    })
  })

  describe('validateTeamForm', () => {
    const validForm = {
      name: 'Test Team',
      playerIds: [
        '93712692',
        '87275350',
        '12345678',
        '23456789',
        '34567890',
      ],
    }

    it('validates a correct form', () => {
      const result = validateTeamForm(validForm)
      expect(result.valid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
    })

    it('validates form with Steam64 IDs', () => {
      const form = {
        name: 'Test Team',
        playerIds: [
          '76561198053978420',
          '76561198047541078',
          '76561198012345678',
          '76561198023456789',
          '76561198034567890',
        ],
      }
      const result = validateTeamForm(form)
      expect(result.valid).toBe(true)
    })

    it('validates form with optional team ID', () => {
      const form = {
        ...validForm,
        teamId: '8376696',
      }
      const result = validateTeamForm(form)
      expect(result.valid).toBe(true)
    })

    describe('team name validation', () => {
      it('rejects empty team name', () => {
        const form = { ...validForm, name: '' }
        const result = validateTeamForm(form)
        expect(result.valid).toBe(false)
        expect(result.errors.name).toBe('Team name is required')
      })

      it('rejects whitespace-only team name', () => {
        const form = { ...validForm, name: '   ' }
        const result = validateTeamForm(form)
        expect(result.valid).toBe(false)
        expect(result.errors.name).toBe('Team name is required')
      })
    })

    describe('player IDs validation', () => {
      it('rejects less than 5 player IDs', () => {
        const form = {
          name: 'Test Team',
          playerIds: ['93712692', '87275350', '12345678'],
        }
        const result = validateTeamForm(form)
        expect(result.valid).toBe(false)
        expect(result.errors.playerIds).toBe('Exactly 5 Steam IDs are required')
      })

      it('rejects more than 5 player IDs', () => {
        const form = {
          name: 'Test Team',
          playerIds: [
            '93712692', '87275350', '12345678',
            '23456789', '34567890', '45678901',
          ],
        }
        const result = validateTeamForm(form)
        expect(result.valid).toBe(false)
        expect(result.errors.playerIds).toBe('Exactly 5 Steam IDs are required')
      })

      it('rejects empty player ID at specific position', () => {
        const form = {
          name: 'Test Team',
          playerIds: ['93712692', '', '12345678', '23456789', '34567890'],
        }
        const result = validateTeamForm(form)
        expect(result.valid).toBe(false)
        expect(result.errors.player1).toBe('Player 2 Steam ID is required')
      })

      it('rejects invalid player ID format', () => {
        const form = {
          name: 'Test Team',
          playerIds: ['93712692', '123', '12345678', '23456789', '34567890'],
        }
        const result = validateTeamForm(form)
        expect(result.valid).toBe(false)
        expect(result.errors.player1).toBe('Invalid Steam ID format for Player 2')
      })

      it('rejects duplicate Steam IDs', () => {
        const form = {
          name: 'Test Team',
          playerIds: ['93712692', '93712692', '12345678', '23456789', '34567890'],
        }
        const result = validateTeamForm(form)
        expect(result.valid).toBe(false)
        expect(result.errors.playerIds).toBe('Duplicate Steam IDs are not allowed')
      })
    })

    describe('team ID validation', () => {
      it('accepts empty team ID', () => {
        const form = { ...validForm, teamId: '' }
        const result = validateTeamForm(form)
        expect(result.valid).toBe(true)
      })

      it('accepts whitespace-only team ID', () => {
        const form = { ...validForm, teamId: '   ' }
        const result = validateTeamForm(form)
        expect(result.valid).toBe(true)
      })

      it('accepts valid team ID', () => {
        const form = { ...validForm, teamId: '8376696' }
        const result = validateTeamForm(form)
        expect(result.valid).toBe(true)
      })

      it('rejects zero team ID', () => {
        const form = { ...validForm, teamId: '0' }
        const result = validateTeamForm(form)
        expect(result.valid).toBe(false)
        expect(result.errors.teamId).toBe('Team ID must be a positive integer')
      })

      it('rejects negative team ID', () => {
        const form = { ...validForm, teamId: '-123' }
        const result = validateTeamForm(form)
        expect(result.valid).toBe(false)
        expect(result.errors.teamId).toBe('Team ID must be a positive integer')
      })

      it('rejects non-numeric team ID', () => {
        const form = { ...validForm, teamId: 'abc' }
        const result = validateTeamForm(form)
        expect(result.valid).toBe(false)
        expect(result.errors.teamId).toBe('Team ID must be a positive integer')
      })
    })
  })
})
