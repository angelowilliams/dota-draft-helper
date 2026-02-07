const OPENDOTA_API_URL = 'https://api.opendota.com/api';

function getApiKey(): string {
  const key = import.meta.env.VITE_OPENDOTA_API_KEY;
  if (!key) {
    throw new Error('OpenDota API key not found. Please set VITE_OPENDOTA_API_KEY in .env');
  }
  return key;
}

/**
 * Fetch from the OpenDota REST API with API key appended.
 * Throws on non-OK responses.
 */
export async function opendotaFetch<T = any>(endpoint: string): Promise<T> {
  const apiKey = getApiKey();
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${OPENDOTA_API_URL}${endpoint}${separator}api_key=${apiKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`OpenDota API error: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  if (!text) throw new Error(`OpenDota returned empty body for ${endpoint}`);
  return JSON.parse(text);
}

// Re-export Steam ID utilities
export { steam32ToSteam64, steam64ToSteam32, normalizeToSteam32 } from '@/utils/steamId';
