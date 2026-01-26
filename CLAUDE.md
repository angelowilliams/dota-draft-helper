# Claude Code Instructions - Dota Draft Helper

## Project Overview
A local-only web application for Dota 2 teams to scout opponents and assist during Captain's Mode drafts. Built with React, TypeScript, Vite, Tailwind CSS, and IndexedDB (Dexie.js).

## Tech Stack
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (dark theme with Dota colors)
- **Data Storage**: IndexedDB via Dexie.js
- **API**: STRATZ GraphQL API
- **HTTP Client**: graphql-request
- **Drag & Drop**: @dnd-kit (team player reordering)
- **Icons**: Lucide React
- **Notifications**: react-hot-toast
- **Date Handling**: date-fns

## Project Structure
```
src/
├── api/              # STRATZ API client and queries
│   ├── stratz.ts     # GraphQL client initialization
│   ├── players.ts    # Player hero stats (past 100 games)
│   ├── matches.ts    # Team match history
│   └── teams.ts      # Team info and logos
├── components/       # React components
│   ├── App.tsx       # Main app with tab navigation and state
│   ├── ErrorBoundary.tsx  # Global error handling
│   ├── TeamManagementView.tsx  # Team CRUD
│   ├── TeamForm.tsx  # Team create/edit with drag-drop
│   ├── ScoutingView.tsx  # Team selection for scouting
│   ├── PlayerScoutingView.tsx  # Player stats display
│   ├── PlayerHeroList.tsx  # Individual player hero table
│   ├── MatchHistory.tsx  # Match list with drafts
│   ├── DraftDisplay.tsx  # Chronological draft visualization
│   └── DraftAssistantView.tsx  # Interactive draft tool
├── db/              # Dexie.js database schema
│   ├── database.ts   # Schema definition
│   ├── teams.ts      # Team operations
│   └── players.ts    # Player/hero stats operations
├── hooks/           # Custom React hooks
│   ├── useTeams.ts   # Team management
│   ├── usePlayerData.ts  # Player data fetching
│   └── useHeroes.ts  # Hero data loading
├── utils/           # Utility functions
│   ├── steamId.ts    # Steam32/64 conversion
│   └── validation.ts # Form validation
├── config/          # Configuration files
│   ├── draftOrder.ts # Captain's Mode draft sequence
│   └── heroes.ts     # Hero portrait URLs
└── types.ts         # TypeScript types

scripts/             # Build/data scripts
├── fetch-hero-portraits.ts  # Downloads hero images
public/              # Static assets
└── heroes/          # 127 hero portraits (64x36px)
```

## Key Features

### 1. Teams Management
- Create/edit teams with 5 Steam IDs per team
- Optional STRATZ team ID for match history
- Drag-and-drop player reordering (position 1-5)
- Auto-fetch team logos from STRATZ
- Display player names next to Steam IDs when available

### 2. Player Scouting
- View hero statistics for all 5 players in a team
- Shows past 100 games per player (ranked, unranked, competitive)
- Excludes Turbo mode
- Statistics: Total games, Comp games, Win%, Avg IMP
- Prefix-only hero name search
- Scrollable hero lists with custom styled scrollbars
- Clickable player names link to STRATZ profiles

### 3. Match History
- Recent competitive matches for teams with STRATZ team ID
- Displays opponent names (fetched from STRATZ)
- Chronological draft visualization (2 rows: Radiant/Dire)
- Shows which team had first pick
- Win/loss highlighting
- Refresh button to reload matches

### 4. Draft Assistant
- **Team Selection**: Choose first pick and second pick teams
- **Interactive Draft Grid**: 24 cells (12 bans, 10 picks) in chronological order
- **Hero Selection**: Click cell → autocomplete dropdown with prefix search
- **Visual Feedback**:
  - Picks: Colored borders (green/red for team)
  - Bans: Gray border, grayscale + opacity
  - Selected cell: Yellow border
- **Real-time Scouting Integration**:
  - Player hero stats displayed for both teams (5 columns each)
  - Green highlight: Hero picked by your team
  - Red highlight + grayscale: Hero banned or picked by opponent
- **Session Persistence**: Draft state preserved when switching tabs
- **Controls**: Reset Draft, Change Teams buttons

### 5. Session State Management
- State lifted to App.tsx for persistence across tab switches
- Scouting: Selected team persists
- Draft Assistant: All draft state persists (teams, picks, bans, selected cell)
- Only manual reset buttons clear state

## Development Guidelines

### Code Style
- Use functional components with TypeScript
- Prefer named exports
- Use path aliases (@/components, @/api, @/db, etc.)
- Follow React hooks best practices
- Keep components focused and composable
- Use controlled components for forms and state management

### Data Management
- All player/team data stored in IndexedDB
- STRATZ API used only for fetching new data (past 100 games limit)
- Hero portraits stored as local files in public/heroes/
- Fetch player data on-demand (manual refresh)
- Cache team logos in IndexedDB

### UI/UX
- Use hero portraits (not text names) at natural aspect ratio
- Dark theme with Dota-themed colors:
  - Radiant: #92A525 (green)
  - Dire: #C23C2A (red)
  - Backgrounds: #0F1419, #1A1F26, #252A31
  - Highlights: Green for picks, Red for bans/opponent, Yellow for selection
- Custom scrollbars (8px thin, dark themed)
- Hero portrait dimensions: 64x36px (natural aspect ratio)
- No wrapping in draft displays (horizontal scroll if needed)
- Responsive design not required (local desktop use only)

### API Usage
- STRATZ API token stored in .env as VITE_STRATZ_API_TOKEN
- Use GraphQL queries via graphql-request
- **Required header**: 'User-Agent: STRATZ_API'
- Match query: 100 games max (take: 100)
- Game mode IDs: [1, 2, 3, 4, 5, 10, 16, 22] (excludes Turbo mode 23)
- Lobby type 1 = competitive/tournament
- Handle rate limiting gracefully
- Cache data locally to minimize API calls

### Captain's Mode Draft Order
- Based on **first pick vs second pick**, not Radiant vs Dire
- Total: 24 actions (12 bans, 10 picks)
- Order: FP ban 1-2, SP ban 3-4, FP ban 5, SP ban 6-7, FP pick 8, SP pick 9, FP ban 10-11, SP ban 12, SP pick 13, FP pick 14-15, SP pick 16-17, FP pick 18, FP ban 19, SP ban 20, FP ban 21, SP ban 22, FP pick 23, SP pick 24
- See src/config/draftOrder.ts for full sequence

### Error Handling
- ErrorBoundary wraps entire app
- Validation throughout (API layer, hooks, components)
- Graceful error messages with retry options
- Null checks for all data access

## Important Notes
- This app is for local use only, no hosting/deployment needed
- Prioritize functionality over aesthetics
- Hero data changes rarely, portraits fetched once via script
- **Steam IDs**: Accept both Steam32 (e.g., 93712692) and Steam64 (17-digit)
  - STRATZ API uses Steam32 internally
  - Steam64 automatically converted to Steam32
  - See src/utils/steamId.ts for conversion logic
- STRATZ API documentation: https://docs.stratz.com/
- Player names: Prefer proSteamAccount.name over steamAccount.name

## Common Tasks

### Adding a New Feature
1. Create types in src/types.ts
2. Add database schema changes to src/db/
3. Create/update API queries in src/api/
4. Build UI components in src/components/
5. Wire up with hooks in src/hooks/
6. Add state management to App.tsx if needed for persistence

### Debugging API Issues
- Check STRATZ API token in .env
- Verify 'User-Agent: STRATZ_API' header present
- Check Steam ID format (convert to Steam32 if needed)
- Verify game mode IDs (numeric, not enum names)
- Check take/skip parameters (max 100)
- Review STRATZ API docs for field changes

### Updating Hero Data
- Run `npm run fetch-heroes` to refresh portraits from Valve CDN
- Hero IDs are from Dota 2 game files (integer IDs)
- STRATZ uses these same IDs
- Portraits stored in public/heroes/ as {heroId}.png

### Working with Draft Display
- Draft order is in src/config/draftOrder.ts
- First pick determination: Check first action's isRadiant field
- Display format: 2 rows (Radiant top, Dire bottom) or (First Pick, Second Pick)
- Bans: Grayscale + opacity, gray border
- Picks: Colored border (team color), numbered badge

## File Naming Conventions
- Components: PascalCase (e.g., DraftAssistantView.tsx)
- Utilities: camelCase (e.g., steamId.ts)
- Hooks: camelCase with 'use' prefix (e.g., usePlayerData.ts)
- Types: Defined in types.ts

## Performance Considerations
- IndexedDB queries are async, use hooks for state management
- Hero lists use virtual scrolling (max-height + overflow)
- Search is prefix-only (startsWith) for performance
- Memoize sorted/filtered hero lists
- Custom scrollbars for better UX
- Parallel API fetches for multiple players

## Dependencies
- **Production**: React, Dexie, graphql-request, @dnd-kit, lucide-react, react-hot-toast, date-fns
- **Dev**: Vite, TypeScript, Tailwind CSS, PostCSS
- Keep dependencies minimal and update conservatively

## Security Notes
- API token should never be committed (.env.example only)
- No user authentication needed (local use)
- No sensitive data validation required
- Steam IDs are public information
