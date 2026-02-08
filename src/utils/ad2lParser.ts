import { normalizeToSteam32 } from '@/utils/steamId'

/**
 * URL patterns to check, in priority order.
 * Each returns a Steam ID string (Steam32) or null.
 */
const LINK_PATTERNS: Array<{
  match: (href: string) => string | null
}> = [
  {
    // steam://friends/add/[steamID] (Steam64)
    match: (href) => {
      const m = href.match(/^steam:\/\/friends\/add\/(\d+)/)
      return m ? String(normalizeToSteam32(m[1])) : null
    },
  },
  {
    // stratz.com/players/[steam32]
    match: (href) => {
      const m = href.match(/stratz\.com\/players\/(\d+)/)
      return m ? m[1] : null
    },
  },
  {
    // opendota.com/players/[steam32]
    match: (href) => {
      const m = href.match(/opendota\.com\/players\/(\d+)/)
      return m ? m[1] : null
    },
  },
  {
    // dotabuff.com/players/[steam32]
    match: (href) => {
      const m = href.match(/dotabuff\.com\/players\/(\d+)/)
      return m ? m[1] : null
    },
  },
  {
    // steamcommunity.com/profiles/[steam64]
    match: (href) => {
      const m = href.match(/steamcommunity\.com\/profiles\/(\d+)/)
      return m ? String(normalizeToSteam32(m[1])) : null
    },
  },
]

/**
 * Extracts a Steam32 ID from links inside a DOM element.
 * Checks URL patterns in priority order, returns first match.
 */
export function extractSteamIdFromContainer(
  container: Element,
): string | null {
  const links = container.querySelectorAll('a[href]')

  for (const pattern of LINK_PATTERNS) {
    for (const link of links) {
      const href = link.getAttribute('href') || ''
      const result = pattern.match(href)
      if (result) return result
    }
  }

  return null
}

/**
 * Parses an AD2L team page HTML and extracts player info.
 */
export function parseAD2LPage(html: string): {
  name: string
  playerIds: string[]
  altAccountMap: Record<string, string[]>
} {
  const doc = new DOMParser().parseFromString(html, 'text/html')

  // Extract team name from h1/h2, excluding headings with "League" or "Season"
  let name = ''
  const headings = doc.querySelectorAll('h1, h2')
  for (const h of headings) {
    const text = h.textContent?.trim() || ''
    if (text && !/League|Season/i.test(text)) {
      name = text
      break
    }
  }

  // Find main player containers (not alt)
  const mainContainers = doc.querySelectorAll(
    '.rosterNameContainer:not(.rosterNameContainer-alt)',
  )

  const playerIds: string[] = []
  const seenIds = new Set<string>()
  const altAccountMap: Record<string, string[]> = {}

  for (const mainContainer of mainContainers) {
    const mainId = extractSteamIdFromContainer(mainContainer)
    if (!mainId || seenIds.has(mainId)) continue

    playerIds.push(mainId)
    seenIds.add(mainId)

    // Alt containers become siblings due to HTML parsing (li cannot nest in li).
    // Walk following siblings until we hit a non-alt rosterNameContainer or run out.
    const altIds: string[] = []
    let sibling = mainContainer.nextElementSibling
    while (sibling?.classList.contains('rosterNameContainer-alt')) {
      const altId = extractSteamIdFromContainer(sibling)
      if (altId && !seenIds.has(altId)) {
        altIds.push(altId)
        seenIds.add(altId)
      }
      sibling = sibling.nextElementSibling
    }

    if (altIds.length > 0) {
      altAccountMap[mainId] = altIds
    }
  }

  return {
    name,
    playerIds,
    altAccountMap,
  }
}
