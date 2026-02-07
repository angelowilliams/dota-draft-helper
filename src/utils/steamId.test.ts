import { describe, it, expect } from 'vitest'
import {
  steam64ToSteam32,
  steam32ToSteam64,
  normalizeToSteam32,
  isSteam64,
} from './steamId'

describe('steamId', () => {
  describe('steam64ToSteam32', () => {
    it('converts known Steam64 ID to Steam32 (SumaiL)', () => {
      expect(steam64ToSteam32('76561198053978420')).toBe(93712692)
    })

    it('converts another known Steam64 ID', () => {
      // Arteezy: 76561198047541078 -> 87275350
      expect(steam64ToSteam32('76561198047541078')).toBe(87275350)
    })

    it('converts boundary Steam64 value', () => {
      // Minimum valid Steam32 ID (1) would be 76561197960265729
      expect(steam64ToSteam32('76561197960265729')).toBe(1)
    })

    it('handles large Steam64 IDs', () => {
      expect(steam64ToSteam32('76561198999999999')).toBe(1039734271)
    })
  })

  describe('steam32ToSteam64', () => {
    it('converts known Steam32 ID to Steam64 (SumaiL)', () => {
      expect(steam32ToSteam64(93712692)).toBe('76561198053978420')
    })

    it('converts Steam32 as string', () => {
      expect(steam32ToSteam64('93712692')).toBe('76561198053978420')
    })

    it('converts minimum Steam32 ID', () => {
      expect(steam32ToSteam64(1)).toBe('76561197960265729')
    })

    it('handles large Steam32 IDs', () => {
      expect(steam32ToSteam64(1039734271)).toBe('76561198999999999')
    })
  })

  describe('round-trip conversion', () => {
    it('steam64 -> steam32 -> steam64 returns original', () => {
      const original = '76561198053978420'
      const steam32 = steam64ToSteam32(original)
      const backTo64 = steam32ToSteam64(steam32)
      expect(backTo64).toBe(original)
    })

    it('steam32 -> steam64 -> steam32 returns original', () => {
      const original = 93712692
      const steam64 = steam32ToSteam64(original)
      const backTo32 = steam64ToSteam32(steam64)
      expect(backTo32).toBe(original)
    })
  })

  describe('normalizeToSteam32', () => {
    it('returns Steam32 unchanged', () => {
      expect(normalizeToSteam32('93712692')).toBe(93712692)
    })

    it('converts Steam64 to Steam32', () => {
      expect(normalizeToSteam32('76561198053978420')).toBe(93712692)
    })

    it('trims whitespace from Steam32', () => {
      expect(normalizeToSteam32('  93712692  ')).toBe(93712692)
    })

    it('trims whitespace from Steam64', () => {
      expect(normalizeToSteam32('  76561198053978420  ')).toBe(93712692)
    })

    it('handles small Steam32 IDs', () => {
      expect(normalizeToSteam32('12345')).toBe(12345)
    })

    it('handles 16-digit numbers as Steam32', () => {
      // 16 digits is not Steam64 (which must be 17)
      expect(normalizeToSteam32('1234567890123456')).toBe(1234567890123456)
    })
  })

  describe('isSteam64', () => {
    it('returns true for valid Steam64 ID', () => {
      expect(isSteam64('76561198053978420')).toBe(true)
    })

    it('returns true for another valid Steam64 ID', () => {
      expect(isSteam64('76561198047541078')).toBe(true)
    })

    it('returns false for Steam32 ID', () => {
      expect(isSteam64('93712692')).toBe(false)
    })

    it('returns false for 17 digits not starting with 7656119', () => {
      expect(isSteam64('12345678901234567')).toBe(false)
    })

    it('returns false for 16 digit number', () => {
      expect(isSteam64('7656119805397842')).toBe(false)
    })

    it('returns false for 18 digit number starting with 7656119', () => {
      expect(isSteam64('765611980539784200')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isSteam64('')).toBe(false)
    })
  })
})
