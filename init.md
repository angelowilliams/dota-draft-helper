# Overview
I want to build a webapp that we will only use locally for my Dota 2 team prepare for Captain's Mode drafts.

# Use cases
1. Scouting the enemy team's players' matches ahead of our matches.
2. Browsing player data (both our players' and theirs') during the draft phase of matches.

## Scouting features
* Team profiles: a team contains 5 players identified by their STEAM IDs. Each team has a name. These team profiles are stored locally. A team is identified by a TEAM ID. The user must input 5 player STEAM IDs, but the team ID is optional.
* Team profiles can be deleted.
* For each player, use their STEAM ID to fetch their match data. There are two types of matches we care about: pub games and ticketed competitive lobbies.
* When selecting a team, there is another option to select whether to refresh the team's data. This will triggering fetching the data for all players on that team. Data is stored locally.
* For each player, we'll want to display their heroes in order of games played, with a column for number of pubs and a column for number of compeitive lobbies.
* All 5 players will be displayed at the same time.
* The time window for which games to include is customizable. The end window will always be now, but the start date can be changed. The default is the past 3 months.
* There will be a filter bar where you can enter a hero name and filter down to only games on that specific hero.
* There will be another dashboard beneath the prior views that, if a team ID was provided, the most recent ticketed compeittive games played by that team are displayed. We also want to show the ticket / tournament that those games belong to. Specifically, we want to show the ticket, the game outcome, and the draft of the game.

## Draft help features
1. The draft view is similar to the scouting view, but we want to show two teams' players at once. There'll be a config file where we can input the draft order. A team will be set as Radiant, and a team will be set as Dire.
2. For each pick / ban in the draft, the user will select a hero. In the players' heroes list, if the hero is banned, the row will be highlighted red. If the hero is picked, the row will be highlighted green.

# Other guidelines
* Use the STRATZ API for fetching player / match / team data.
* When heroes are displayed in a table view, we want to use their icon / photo instead of their name for better clarity.
* This webapp will never be hosted and only ran locally.
* For the tech stack, use Vite + React + Tailwind + IndexedDB/Dexie.js
* Claude Code / agents should automatically update the README, CLAUDE.md, and skills directory.

# Project initialization
1. Using the info in this file, as well as your knowledge of current best practices, generate a CLAUDE.md focused on general instructions for Claude Code, a README.md designed for human consumption on project focus and build/run instructions, and a skills directory containing Claude skills.
2. Fetch and locally store (as files) the hero portraits.
3. Build out the scouting dashboard first.
