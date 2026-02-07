# Project Memory - Dota Draft Helper

## Critical Patterns

### STRATZ API
- **MUST** include `'User-Agent': 'STRATZ_API'` header
- Steam32 IDs only - use `normalizeToSteam32()` from `@/utils/steamId`
- Max 100 games per query (`take: 100`)
- Game modes: `[1, 2, 3, 4, 5, 10, 16, 22]` (excludes Turbo = 23)
- Lobby type 1 = competitive/tournament

### Draft Order
- 24 actions: 14 bans, 10 picks
- **First Pick ≠ Radiant** - use `team: 'firstPick' | 'secondPick'`
- Source of truth: `src/config/draftOrder.ts` - never hardcode

### State Management
- Draft state: `DraftContext` (persists across tab switches)
- View/scouting: `App.tsx` state
- Persistent data: IndexedDB via Dexie.js

## Common Issues

| Issue | Solution |
|-------|----------|
| API 401/403 | Check .env token, User-Agent header |
| Steam64 errors | Convert with `normalizeToSteam32()` |
| Hero portraits broken | Run `npm run fetch-heroes` |
| Draft state lost | Use `useDraft()` from DraftContext |

## Anti-Patterns

- Hardcoding draft order
- Using Steam64 in API calls
- Assuming Radiant = First Pick
- Forgetting User-Agent header
- Committing .env file
- Using localStorage for large data

## Recent Changes (Feb 2026)

- **Testing**: Vitest + 147 tests for utils, config, services
- **Services Layer**: `src/services/heroStats.ts`, `src/services/draft.ts`
- **DraftContext**: Replaced 17 props with context-based state
- **Documentation**: Consolidated to ~300 lines total

## Test Data

- Steam32: `93712692` (SumaiL)
- Team ID: `8376696` (Team Liquid)
- Hero ID: `1` (Anti-Mage)

## Links

- STRATZ API: https://docs.stratz.com/
- Dexie.js: https://dexie.org/
- Captain's Mode: https://liquipedia.net/dota2/Game_Modes#Captains_Mode
