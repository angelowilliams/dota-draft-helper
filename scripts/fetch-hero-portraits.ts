import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const OPENDOTA_API_URL = 'https://api.opendota.com/api';
const OPENDOTA_CDN_URL = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes';

interface Hero {
  id: number;
  name: string;
  localized_name: string;
}

interface HeroOutput {
  id: number;
  name: string;
  displayName: string;
  shortName: string;
}

async function fetchHeroes(): Promise<HeroOutput[]> {
  console.log('Fetching heroes from OpenDota API (public, no auth required)...');
  const response = await fetch(`${OPENDOTA_API_URL}/heroes`);

  if (!response.ok) {
    throw new Error(`Failed to fetch heroes: ${response.statusText}`);
  }

  const heroes: Hero[] = await response.json();

  // Convert OpenDota format to our format
  return heroes.map(hero => ({
    id: hero.id,
    name: hero.name,
    displayName: hero.localized_name,
    shortName: hero.name.replace('npc_dota_hero_', ''),
  }));
}

async function downloadImage(url: string, filepath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  writeFileSync(filepath, Buffer.from(buffer));
}

async function main() {
  const heroes = await fetchHeroes();
  console.log(`Found ${heroes.length} heroes`);

  // Create heroes directory
  const heroesDir = join(process.cwd(), 'public', 'heroes');
  if (!existsSync(heroesDir)) {
    mkdirSync(heroesDir, { recursive: true });
  }

  console.log('Downloading hero portraits...');
  let downloaded = 0;
  let failed = 0;

  for (const hero of heroes) {
    try {
      // Download portrait from Valve's CDN
      const portraitUrl = `${OPENDOTA_CDN_URL}/${hero.shortName}.png`;
      const portraitPath = join(heroesDir, `${hero.id}.png`);

      await downloadImage(portraitUrl, portraitPath);
      downloaded++;

      if (downloaded % 10 === 0) {
        console.log(`Downloaded ${downloaded}/${heroes.length}...`);
      }
    } catch (error) {
      // Try without underscore replacement for some heroes
      try {
        const altUrl = `${OPENDOTA_CDN_URL}/${hero.name.replace('npc_dota_hero_', '')}.png`;
        await downloadImage(altUrl, join(heroesDir, `${hero.id}.png`));
        downloaded++;
      } catch {
        console.error(`Failed to download portrait for ${hero.displayName} (ID: ${hero.id})`);
        failed++;
      }
    }
  }

  console.log(`\nComplete!`);
  console.log(`Successfully downloaded: ${downloaded}`);
  console.log(`Failed: ${failed}`);

  // Save hero metadata as JSON
  const metadataPath = join(heroesDir, 'heroes.json');
  writeFileSync(metadataPath, JSON.stringify(heroes, null, 2));
  console.log(`\nHero metadata saved to ${metadataPath}`);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
