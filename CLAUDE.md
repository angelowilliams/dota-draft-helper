# Claude Code Instructions - Dota Draft Helper

## Overview

Local-only Dota 2 draft helper. React 18 + TypeScript + Vite + Tailwind CSS + IndexedDB (Dexie.js) + STRATZ GraphQL API.

## Architecture

```
User Input → Component → Hook → Service → API/DB → STRATZ/IndexedDB
                ↓
          DraftContext (draft state)
          App.tsx (view, scouting team)
```

**Key directories:**
- `src/api/` - STRATZ GraphQL queries
- `src/components/` - React components (18 total)
- `src/contexts/` - DraftContext for draft state
- `src/services/` - Pure business logic (heroStats, draft)
- `src/db/` - IndexedDB via Dexie.js (version 5)
- `src/hooks/` - Data fetching hooks
- `src/config/` - draftOrder.ts, heroes.ts
- `src/utils/` - steamId.ts, validation.ts

## Critical Files

| File | Purpose | Modify Carefully |
|------|---------|------------------|
| `src/contexts/DraftContext.tsx` | Draft state management | Yes |
| `src/config/draftOrder.ts` | Captain's Mode sequence (24 actions) | Never |
| `src/db/database.ts` | IndexedDB schema v5 | Version bump required |
| `src/api/rateLimiter.ts` | STRATZ rate limiting (20/sec, 250/min) | Yes |
| `src/types.ts` | Core interfaces | Affects many files |

## STRATZ API Rules

```typescript
// Required header
headers: { 'User-Agent': 'STRATZ_API' }

// Steam ID format: Steam32 only (convert Steam64)
import { normalizeToSteam32 } from '@/utils/steamId';

// Game modes (exclude Turbo = 23)
gameMode: [1, 2, 3, 4, 5, 10, 16, 22]

// Limits
take: 100  // Max games per query
lobbyType: 1  // Competitive/tournament

// Rate limits: 20/sec, 250/min
// Always use stratzRateLimiter.throttle() before API calls
import { stratzRateLimiter } from '@/api/rateLimiter';
await stratzRateLimiter.throttle();
```

## Player Data Architecture

Player match data is fetched from STRATZ and stored as raw matches in IndexedDB (`playerMatches` table). Hero stats are aggregated client-side based on filters.

- **Fetch**: Up to 500 games per player from past year (paginated, sequential)
- **Store**: Raw `PlayerMatch` records in IndexedDB
- **Filter**: Time window (month/3 months/year) and lobby type (all/competitive) applied client-side
- **Display**: `usePlayerData` hook aggregates matches to `HeroStats` on-the-fly

This enables instant filter switching without re-fetching.

## Draft Order

24 actions: 14 bans (7 per team), 10 picks (5 per team). See `src/config/draftOrder.ts`.

**Critical:** First Pick ≠ Radiant. Use `team: 'firstPick' | 'secondPick'` from draftOrder.

## Common Tasks

**Add feature:**
1. Types in `src/types.ts`
2. Service logic in `src/services/`
3. DB operations in `src/db/`
4. Hook in `src/hooks/`
5. Component in `src/components/`
6. Context if shared state needed

**Modify DB schema:**
1. Update `src/db/database.ts`
2. Increment version
3. Add migration if needed
4. Update `src/types.ts`

## Do's

- Use path aliases: `@/components`, `@/api`, `@/db`, etc.
- Convert Steam64 to Steam32 before API calls
- Check IndexedDB cache before fetching
- Use `toast` for notifications
- Run `npm test` after changes
- Try to generate a comprehensive but highly maintaiable set of tests
- Update any documentation, both user- and AI-facing, as changes are made.

## Don'ts

- Hardcode draft order (use draftOrder.ts)
- Use Steam64 directly in API calls
- Assume Radiant = First Pick
- Forget User-Agent header
- Commit .env file

## Debugging

| Issue | Solution |
|-------|----------|
| API 401/403 | Check .env token, User-Agent header |
| No player names | Click "Refresh Player Data" |
| Hero portraits missing | Run `npm run fetch-heroes` |
| Draft state lost | Check DraftContext usage |

## Test Data

- Steam32: `93712692` (SumaiL)
- Team ID: `8376696` (Team Liquid)
- Hero ID: `1` (Anti-Mage)

## Testing

```bash
npm test          # Run all tests
npm run test:watch  # Watch mode
```

Test coverage targets: 100% for `src/utils/`, `src/config/`, `src/services/`
