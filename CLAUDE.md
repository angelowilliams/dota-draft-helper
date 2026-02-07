# Claude Code Instructions - Dota Draft Helper

## Overview

Local-only Dota 2 draft helper. React 18 + TypeScript + Vite + Tailwind CSS + IndexedDB (Dexie.js) + OpenDota REST API.

**Writing style:** Short and plain. Don't perform a tone — no "That's the point", no trying to sound casual or punchy. Just say what's true in as few words as possible. This applies to code comments, commit messages, PR descriptions, review comments, and user-facing text.

## Architecture

```
User Input → Component → Hook → Service → API/DB → OpenDota/IndexedDB
                ↓
          DraftContext (draft state)
          App.tsx (view, scouting team)
```

**Key directories:**
- `src/api/` - OpenDota REST API calls
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
| `src/db/database.ts` | IndexedDB schema v6 | Version bump required |
| `src/types.ts` | Core interfaces | Affects many files |

## OpenDota API Rules

```typescript
// API key passed via query parameter
// Base URL: https://api.opendota.com/api
import { opendotaFetch } from '@/api/opendota';

// Steam ID format: Steam32 only (convert Steam64)
import { normalizeToSteam32 } from '@/utils/steamId';

// Game modes (exclude Turbo = 23)
gameMode: [1, 2, 3, 4, 5, 10, 16, 22]

// Limits
limit: 100  // Max games per request
// lobbyType: 0=normal, 1=practice, 2=tournament, 7=ranked
// "Competitive" filter = lobbyType 1 (practice/inhouse) or 2 (tournament)
```

## Player Data Architecture

Player match data is fetched from OpenDota and stored as raw matches in IndexedDB (`playerMatches` table). Hero stats are aggregated client-side based on filters.

- **Fetch**: Up to 500 games per player from past year (paginated, sequential)
- **Store**: Raw `PlayerMatch` records in IndexedDB
- **Filter**: Time window (month/3 months/year) and lobby type (all/competitive) applied client-side
- **Display**: `usePlayerData` hook aggregates matches to `HeroStats` on-the-fly

This enables instant filter switching without re-fetching.

## Draft Order

24 actions: 14 bans (7 per team), 10 picks (5 per team). See `src/config/draftOrder.ts`.

**Critical:** First Pick ≠ Radiant. Use `team: 'firstPick' | 'secondPick'` from draftOrder.

## GitHub Workflow

Two GitHub accounts are configured. **Never mix them up.**

| Account | Purpose | Auth |
|---------|---------|------|
| `angelowilliams` (main) | Commits, PRs, issues, pushes | Default `gh` auth |
| `tinker17` (bot) | Code review comments only | `BOT_GITHUB_TOKEN` in `.env` |

**Default behavior**: All `gh` commands run as `angelowilliams` via default `gh auth`. Do not set `GH_TOKEN`.

**Code review as tinker17**: When the user asks you to review a PR as tinker17, read `BOT_GITHUB_TOKEN` from `.env` and prefix your `gh` commands with `GH_TOKEN=<token>`. Follow the instructions in `.claude/review-prompt.md` for review focus, format, and personality. Only do this when explicitly asked to review as tinker17.

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
- Commit .env file
- Use `BOT_GITHUB_TOKEN` unless explicitly asked to review as tinker17
- Amend commits or force-push. Make new commits and push normally.
- Add "Generated with Claude Code" or similar branding to commits, PRs, or comments

## Debugging

| Issue | Solution |
|-------|----------|
| API 401/403 | Check .env API key |
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
