# Dota 2 Draft Helper

A local web application for Dota 2 teams to scout opponents and assist during Captain's Mode drafts.

*Note: All code and documentation in this repo is AI-generated.*

## Quick Start

```bash
# Install dependencies
npm install

# Configure OpenDota API key (free at https://www.opendota.com/api-keys)
cp .env.example .env
# Edit .env with your API key

# Download hero portraits
npm run fetch-heroes

# Start development server
npm run dev
```

## Features

- **Team Management** - Store teams with 5 Steam IDs, auto-fetch player names, drag-drop reordering
- **Player Scouting** - Hero pool analysis from past 100 games, pub vs competitive stats
- **Match History** - Recent competitive matches with full draft visualization
- **Draft Assistant** - 24-cell Captain's Mode grid with real-time hero highlighting

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run linter |
| `npm run fetch-heroes` | Download hero portraits |

## Project Structure

```
src/
├── api/           # OpenDota REST API
├── components/    # React components
├── contexts/      # React contexts (DraftContext)
├── db/            # IndexedDB (Dexie.js)
├── hooks/         # Custom React hooks
├── services/      # Business logic (heroStats, draft)
├── utils/         # Utilities (steamId, validation)
├── config/        # Configuration (draftOrder, heroes)
└── types.ts       # TypeScript interfaces
```

## Tech Stack

React 18 + TypeScript + Vite + Tailwind CSS + IndexedDB (Dexie.js) + OpenDota REST API

## For AI Agents

See `CLAUDE.md` for development instructions, architecture, and coding patterns.

## License

Private use only.
