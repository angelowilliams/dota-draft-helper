// Steam ID conversion utilities

const STEAM_ID_OFFSET = BigInt('76561197960265728');

/**
 * Converts Steam64 ID to Steam32 ID
 * Example: 76561198053978420 -> 93712692
 */
export function steam64ToSteam32(steam64: string): number {
  return Number(BigInt(steam64) - STEAM_ID_OFFSET);
}

/**
 * Converts Steam32 ID to Steam64 ID
 * Example: 93712692 -> 76561198053978420
 */
export function steam32ToSteam64(steam32: string | number): string {
  return (BigInt(steam32) + STEAM_ID_OFFSET).toString();
}

/**
 * Normalizes a Steam ID to Steam32 format for API calls
 * Accepts both Steam32 and Steam64 formats
 */
export function normalizeToSteam32(steamId: string): number {
  const id = steamId.trim();

  // Check if it's Steam64 (17 digits starting with 7656119)
  if (id.length === 17 && id.startsWith('7656119')) {
    return steam64ToSteam32(id);
  }

  // Otherwise treat as Steam32
  return parseInt(id, 10);
}

/**
 * Checks if a Steam ID is in Steam64 format
 */
export function isSteam64(steamId: string): boolean {
  return steamId.length === 17 && steamId.startsWith('7656119');
}
