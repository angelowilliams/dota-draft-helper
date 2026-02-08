import { describe, it, expect } from 'vitest'
import { extractSteamIdFromContainer, parseAD2LPage } from './ad2lParser'

// Helper: create an element with given inner HTML
function makeContainer(html: string): Element {
  const doc = new DOMParser().parseFromString(
    `<div>${html}</div>`,
    'text/html',
  )
  return doc.querySelector('div')!
}

describe('extractSteamIdFromContainer', () => {
  it('extracts Steam32 from opendota link', () => {
    const el = makeContainer(
      '<a href="https://www.opendota.com/players/93712692">profile</a>',
    )
    expect(extractSteamIdFromContainer(el)).toBe('93712692')
  })

  it('extracts Steam32 from dotabuff link', () => {
    const el = makeContainer(
      '<a href="https://www.dotabuff.com/players/87275350">profile</a>',
    )
    expect(extractSteamIdFromContainer(el)).toBe('87275350')
  })

  it('extracts Steam32 from stratz link', () => {
    const el = makeContainer(
      '<a href="https://stratz.com/players/93712692">profile</a>',
    )
    expect(extractSteamIdFromContainer(el)).toBe('93712692')
  })

  it('converts Steam64 from steam:// link to Steam32', () => {
    const el = makeContainer(
      '<a href="steam://friends/add/76561198053978420">add</a>',
    )
    expect(extractSteamIdFromContainer(el)).toBe('93712692')
  })

  it('converts Steam64 from steamcommunity link to Steam32', () => {
    const el = makeContainer(
      '<a href="https://steamcommunity.com/profiles/76561198053978420">profile</a>',
    )
    expect(extractSteamIdFromContainer(el)).toBe('93712692')
  })

  it('returns null when no Steam ID links found', () => {
    const el = makeContainer('<a href="https://example.com">nothing</a>')
    expect(extractSteamIdFromContainer(el)).toBeNull()
  })

  it('returns null for empty container', () => {
    const el = makeContainer('<span>no links</span>')
    expect(extractSteamIdFromContainer(el)).toBeNull()
  })

  it('uses first matched link when container has multiple', () => {
    // steam:// is checked first, so it should win
    const el = makeContainer(`
      <a href="steam://friends/add/76561198053978420">add</a>
      <a href="https://www.opendota.com/players/99999">other</a>
    `)
    expect(extractSteamIdFromContainer(el)).toBe('93712692')
  })
})

// Helpers for parseAD2LPage tests
function makePage(roster: string): string {
  return `<html><body><h1>Test Team</h1><ul>${roster}</ul></body></html>`
}

function makePlayer(steamId: string, alts: string[] = []): string {
  const altHtml = alts
    .map(
      (altId) =>
        `<li class="rosterNameContainer rosterNameContainer-alt">
      <div><a href="https://www.opendota.com/players/${altId}">alt</a></div>
    </li>`,
    )
    .join('')

  return `<li class="rosterNameContainer">
    <div><a href="https://www.opendota.com/players/${steamId}">main</a></div>
    ${altHtml}
  </li>`
}

describe('parseAD2LPage', () => {
  it('extracts team name from h1', () => {
    const html = makePage(makePlayer('100'))
    const result = parseAD2LPage(html)
    expect(result.name).toBe('Test Team')
  })

  it('extracts main player IDs', () => {
    const html = makePage(
      makePlayer('100') + makePlayer('200') + makePlayer('300'),
    )
    const result = parseAD2LPage(html)
    expect(result.playerIds).toContain('100')
    expect(result.playerIds).toContain('200')
    expect(result.playerIds).toContain('300')
  })

  it('extracts alt accounts into altAccountMap', () => {
    const html = makePage(makePlayer('100', ['101']))
    const result = parseAD2LPage(html)
    expect(result.altAccountMap).toEqual({ '100': ['101'] })
    // alt ID should also be in playerIds
    expect(result.playerIds).toContain('101')
  })

  it('supports multiple alts per player', () => {
    const html = makePage(makePlayer('100', ['101', '102']))
    const result = parseAD2LPage(html)
    expect(result.altAccountMap).toEqual({ '100': ['101', '102'] })
    expect(result.playerIds).toContain('101')
    expect(result.playerIds).toContain('102')
  })

  it('returns empty altAccountMap when no alts exist', () => {
    const html = makePage(makePlayer('100') + makePlayer('200'))
    const result = parseAD2LPage(html)
    expect(result.altAccountMap).toEqual({})
  })

  it('deduplicates IDs across main and alt', () => {
    // alt ID same as another main ID
    const html = makePage(makePlayer('100', ['200']) + makePlayer('200'))
    const result = parseAD2LPage(html)
    const idCount = result.playerIds.filter((id) => id === '200').length
    expect(idCount).toBe(1)
  })

  it('excludes headings containing League or Season from team name', () => {
    const html = `<html><body>
      <h1>Season 47</h1>
      <h2>My Team</h2>
      <ul>${makePlayer('100')}</ul>
    </body></html>`
    const result = parseAD2LPage(html)
    expect(result.name).toBe('My Team')
  })
})
