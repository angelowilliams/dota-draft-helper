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
- `src/db/` - IndexedDB via Dexie.js (version 7)
- `src/hooks/` - Data fetching hooks
- `src/config/` - draftOrder.ts, heroes.ts
- `src/utils/` - steamId.ts, validation.ts

## Critical Files

| File | Purpose | Modify Carefully |
|------|---------|------------------|
| `src/contexts/DraftContext.tsx` | Draft state management | Yes |
| `src/config/draftOrder.ts` | Captain's Mode sequence (24 actions) | Never |
| `src/db/database.ts` | IndexedDB schema v7 | Version bump required |
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

Two GitHub accounts are configured. **Never mix them up.** Both authenticate via classic GitHub Personal Access Tokens stored in `.env`.

| Account | Purpose | Auth |
|---------|---------|------|
| `tinker17` | Dev work: coding, commits, PRs, merging, issues, pushes | Classic PAT via `TINKER_GITHUB_TOKEN` in `.env` (default `gh` auth) |
| `oracle16117` | PR reviews, approvals, and comments | Classic PAT via `ORACLE_GITHUB_TOKEN` in `.env` |

**Default behavior**: All `gh` commands run as `tinker17` via default `gh` auth (backed by `TINKER_GITHUB_TOKEN`). Do not set `GH_TOKEN` for Tinker commands.

**Tinker personality**: When writing PR descriptions and replying to CR comments, use `.claude/tinker-voicelines.md` for voice lines. Pick lines that fit the context.

**PR reviews and approvals**: Always use Oracle for reviewing, approving, or commenting on PRs. Read `ORACLE_GITHUB_TOKEN` from `.env` and prefix `gh` commands with `GH_TOKEN=<token>`. Follow `.claude/review-prompt.md` for review focus, format, and personality. This includes `gh pr review`, `gh pr comment`, and any `gh api` calls that post review comments.

**Responding to CR feedback**: Make the fixes, commit them, then reply to each review comment with a short description and the commit SHA (e.g. `Fixed in abc1234.`).

## Git Workflow

### Worktree layout

The repo uses worktrees under `dota-draft-helper/`. There is no checkout at the root — all work happens in worktree subdirectories.

**`STATE.md`** lives at the bare root (`dota-draft-helper/STATE.md`) and tracks which worktree holds which branch and PR. Update it whenever you create, reassign, or remove a worktree. Check it at the start of a session to understand the current layout.

| Directory | Role | Lifetime |
|-----------|------|----------|
| `wt1/` | Main worktree (has `.git`). Always on `main`. | Permanent |
| `wt2/` | Feature worktree. | Ephemeral — remove after PR merges |
| `wt3/` | Second feature worktree, same as wt2. | Ephemeral |

### Starting a feature

Run all commands from `wt1/` (which is always on `main`):

```bash
git fetch origin
git worktree add ../wt2 -b my-feature origin/main
cp .env ../wt2/.env
cd ../wt2
npm install
```

### During development

Work in the feature worktree (`wt2/` or `wt3/`). Commit and push normally:

```bash
git add <files>
git commit -m "message"
git push -u origin my-feature
gh pr create --base main
```

### After PR merges

Clean up immediately. Run from `wt1/`:

```bash
git worktree remove ../wt2
git branch -d my-feature
git pull origin main
git remote prune origin
```

### Rules

- **wt1 stays on `main`.** Never check out a feature branch in wt1.
- **PRs always target `main`.** Never target another feature branch.
- **Clean up immediately after merge.** Remove the worktree, delete the local branch, pull main, prune remotes. Don't leave orphaned worktrees or stale branches.
- **Never run `git` or `gh` from the bare root** (`dota-draft-helper/`). Always work from inside a worktree.
- **Update `STATE.md`** at the bare root after any worktree change (create, remove, branch switch).
- Each worktree must be on a different branch.
- `node_modules` is per-worktree — run `npm install` after creating a new worktree.
- `.env` is gitignored — copy it from wt1 when creating a new worktree.

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
- Use `ORACLE_GITHUB_TOKEN` unless explicitly asked to review as Oracle
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
