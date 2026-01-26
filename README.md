# Dota 2 Draft Helper

A local web application designed to help Dota 2 teams prepare for and execute Captain's Mode drafts. Scout opponents, analyze player hero pools, and track picks/bans in real-time during drafts.

DISCLAIMER: every line of code and documentation in this repo is AI-generated / vibe-coded.

## Features

### Team Management
- **Create Team Profiles**: Store teams with 5 Steam IDs and optional STRATZ team ID
- **Drag-Drop Reordering**: Rearrange player positions in team forms by dragging
- **Auto-Name Display**: Player names appear next to Steam IDs once data is fetched
- **Persistent Storage**: All team data saved locally in IndexedDB

### Player Scouting Dashboard
- **Hero Pool Analysis**: View each player's most-played heroes from their past 100 games
- **Pub vs Competitive Stats**: Separate game counts for ranked/unranked and competitive matches
- **Hero Search**: Filter by hero name to quickly find specific picks
- **5-Player Grid**: View all team members' hero pools simultaneously
- **Match History**: Recent competitive matches with full draft visualization and opponent names
- **Smart Caching**: Player data stored locally to minimize API calls

### Draft Assistant
- **Captain's Mode Grid**: 24-cell draft board following official first pick/second pick order
- **Team Selection**: Choose first pick and second pick teams from your saved profiles
- **Autocomplete Hero Picker**: Type to search and select heroes for each draft action
- **Visual Differentiation**:
  - Picks displayed with colored borders (green for first pick, blue for second pick)
  - Bans displayed with gray borders
  - Empty cells show white borders
- **Real-Time Scouting Integration**:
  - Green highlight: Heroes picked by your team
  - Red background + grayscale: Heroes banned or picked by opponent
  - Normal: Available heroes
- **Session Persistence**: Draft state preserved when switching between tabs
- **Natural Hero Portraits**: 64x36 aspect ratio matching official Dota 2 assets

## Tech Stack

- **React 18** with TypeScript for UI components
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for dark-themed styling with Dota 2 color scheme
- **Dexie.js** for local IndexedDB storage
- **STRATZ GraphQL API** for Dota 2 match and player data
- **graphql-request** for API communication
- **@dnd-kit** for drag-and-drop player reordering
- **Lucide React** for icons
- **react-hot-toast** for notifications
- **date-fns** for date formatting

## Prerequisites

- Node.js 18+ and npm
- STRATZ API token (free at https://stratz.com/api)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Token

Copy the example environment file and add your STRATZ API token:

```bash
cp .env.example .env
```

Edit `.env` and replace `your_token_here` with your actual STRATZ API token.

### 3. Fetch Hero Portraits

Download hero portrait images from STRATZ:

```bash
npm run fetch-heroes
```

This creates a `public/heroes/` directory with all hero portrait images.

### 4. Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

## Usage

### Creating Team Profiles

1. Navigate to the **Teams** tab
2. Click **Create New Team**
3. Enter team name and 5 Steam IDs (one per player)
4. Optionally add a STRATZ team ID for competitive match history tracking
5. Drag the grip icon to reorder players if needed
6. Save the team profile

**Finding Steam IDs:**
- From STRATZ profile URL: `stratz.com/players/YOUR_ID`
- From SteamID.io: https://www.steamid.io/
- Accepts both Steam32 (8-digit) and Steam64 (17-digit) formats

### Scouting Opponents

1. Navigate to the **Scouting** tab
2. Select a team from the dropdown
3. Click **Refresh Player Data** to fetch latest stats from STRATZ (past 100 games per player)
4. Use the search bar to filter by hero name
5. View hero statistics across all 5 players:
   - Hero portrait and name
   - Total games played with the hero
   - Win count and win rate
   - Average IMP (Impact score)
   - Pub vs competitive game breakdown
6. If team has a Team ID, view recent competitive match history with full drafts

### During a Draft

1. Navigate to the **Draft Assistant** tab
2. Select **First Pick Team** and **Second Pick Team** from your saved profiles
3. Player hero pools appear for both teams automatically
4. As the draft progresses, click each draft cell (in order) to select a hero:
   - Type hero name in the autocomplete dropdown
   - Select the hero from the filtered list
5. Visual feedback updates automatically:
   - Draft grid shows picks (colored borders) and bans (gray borders)
   - Player hero tables highlight unavailable heroes (red + grayscale)
   - Your team's picks highlighted in green
6. State persists when switching tabs - return to Draft Assistant to resume

### Managing Your Data

- **Edit Teams**: Click the edit icon on any team card to modify
- **Delete Teams**: Click the trash icon to remove a team
- **Clear Draft**: Reset first/second pick selections to clear the draft grid
- **Session State**: Scouting team selection and draft state persist until manually reset

## Captain's Mode Draft Order

The Draft Assistant implements the official Dota 2 Captain's Mode draft sequence (24 total actions):

**Ban Phase 1** (7 actions):
1. First Pick: Ban
2. First Pick: Ban
3. Second Pick: Ban
4. Second Pick: Ban
5. First Pick: Ban
6. Second Pick: Ban
7. Second Pick: Ban

**Pick Phase 1** (2 actions):
8. First Pick: Pick
9. Second Pick: Pick

**Ban Phase 2** (3 actions):
10. First Pick: Ban
11. First Pick: Ban
12. Second Pick: Ban

**Pick Phase 2** (3 actions):
13. Second Pick: Pick
14. First Pick: Pick
15. First Pick: Pick

**Pick Phase 3** (2 actions):
16. Second Pick: Pick
17. Second Pick: Pick

**Ban Phase 3** (4 actions):
18. First Pick: Pick
19. First Pick: Ban
20. Second Pick: Ban
21. First Pick: Ban

**Final Picks** (3 actions):
22. Second Pick: Ban
23. First Pick: Pick
24. Second Pick: Pick

The grid displays cells in chronological order. Click each cell sequentially as picks and bans occur.

## Project Structure

```
src/
├── api/              # STRATZ API integration
├── components/       # React components
├── db/              # Database schema and queries
├── hooks/           # Custom React hooks
├── utils/           # Helper functions
└── config/          # App configuration

scripts/             # Build and data scripts
public/              # Static assets (hero portraits)
```

## How It Works

### Data Flow
1. **Team Creation**: Steam IDs stored in IndexedDB
2. **Data Fetching**: STRATZ API queries player matches (up to 100 per player)
3. **Local Storage**: Player names, hero stats, and match history cached in IndexedDB
4. **Real-Time Updates**: Draft selections trigger immediate visual updates across all components

### API Usage
- **Player Data**: Fetches last 100 matches per Steam ID
- **Game Modes**: Includes All Pick, Ranked, Captains Mode (excludes Turbo mode)
- **Hero Stats**: Aggregated client-side from match data (games played, wins, average IMP)
- **Match History**: Team matches fetched via STRATZ team ID
- **Rate Limiting**: Data cached locally to minimize API calls

### Session Persistence
- Draft state (team selections, picks/bans) persists across tab switches
- Scouting team selection maintained during session
- All state cleared on page reload or manual reset
- IndexedDB data persists permanently until cleared

## Build for Production

```bash
npm run build
```

Built files will be in the `dist/` directory. Serve with any static file server:

```bash
npm run preview
```

## Troubleshooting

### API Token Issues
- Verify your token is valid at https://stratz.com/api
- Check that `.env` file exists and contains `VITE_STRATZ_API_TOKEN=your_token_here`
- Restart the dev server after changing `.env` (Ctrl+C, then `npm run dev`)
- STRATZ API requires the header `User-Agent: STRATZ_API` (automatically included)

### Missing or Broken Hero Portraits
- Run `npm run fetch-heroes` to download all 127 hero portraits
- Check that `public/heroes/` directory exists and contains PNG files
- Verify your STRATZ API token is valid
- Hero portraits are 64x36 pixels (natural Dota 2 aspect ratio)

### Steam ID Format
- **Recommended**: Use Steam32 IDs from your STRATZ profile URL (e.g., `93712692` from `stratz.com/players/93712692`)
- **Also Accepted**: Steam64 IDs (17 digits, e.g., `76561198053978420`) - automatically converted to Steam32
- **Find Steam IDs**:
  - Your STRATZ profile page
  - https://www.steamid.io/
  - Steam profile URL

### Player Names Not Showing
- Player names appear after clicking **Refresh Player Data** in Scouting view
- Names are cached in IndexedDB after first fetch
- If names don't appear, the Steam ID may be invalid or the player profile may be private

### No Match History Showing
- Team must have a **Team ID** configured (STRATZ competitive team ID)
- Only shows matches where the team participated as a team
- Click the refresh icon next to "Recent Competitive Matches" to fetch latest data

### Draft Order Questions
The draft follows official Captain's Mode order:
- **Phase 1**: FP ban 2, SP ban 2, FP ban 1, SP ban 2, FP pick 1, SP pick 2
- **Phase 2**: FP ban 2, SP ban 1, SP pick 1, FP pick 2, SP pick 2
- **Phase 3**: FP pick 1, FP ban 1, SP ban 1, FP ban 1, SP ban 1, FP pick 1, SP pick 1

(FP = First Pick team, SP = Second Pick team)

## Data Storage

All data is stored locally in your browser's IndexedDB. This includes:
- Team profiles
- Player statistics
- Match history
- Draft configurations

Clear browser data to reset the application.

## Contributing

This is a private tool for team use. Contributions should maintain the local-only nature of the application.

## License

Private use only.
