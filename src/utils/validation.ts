// Steam ID validation utilities

export function isValidSteamId32(steamId: string): boolean {
  // Steam32 IDs are typically 8-10 digits
  const steamIdRegex = /^\d{7,10}$/;
  const num = parseInt(steamId, 10);
  return steamIdRegex.test(steamId) && !isNaN(num) && num > 0;
}

export function isValidSteamId64(steamId: string): boolean {
  // Steam64 IDs are 17 digits starting with 7656119
  const steamIdRegex = /^7656119\d{10}$/;
  return steamIdRegex.test(steamId);
}

export function isValidSteamId(steamId: string): boolean {
  // Accept both Steam32 and Steam64 formats
  return isValidSteamId32(steamId) || isValidSteamId64(steamId);
}

export function validateTeamForm(data: {
  name: string;
  playerIds: string[];
  teamId?: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Validate team name
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Team name is required';
  }

  // Validate player IDs
  if (data.playerIds.length !== 5) {
    errors.playerIds = 'Exactly 5 Steam IDs are required';
  } else {
    data.playerIds.forEach((id, index) => {
      if (!id || id.trim().length === 0) {
        errors[`player${index}`] = `Player ${index + 1} Steam ID is required`;
      } else if (!isValidSteamId(id.trim())) {
        errors[`player${index}`] = `Invalid Steam ID format for Player ${index + 1}`;
      }
    });
  }

  // Check for duplicate Steam IDs
  const uniqueIds = new Set(data.playerIds.map(id => id.trim()));
  if (uniqueIds.size !== data.playerIds.length) {
    errors.playerIds = 'Duplicate Steam IDs are not allowed';
  }

  // Validate team ID if provided
  if (data.teamId && data.teamId.trim().length > 0) {
    const teamIdNum = parseInt(data.teamId.trim(), 10);
    if (isNaN(teamIdNum) || teamIdNum <= 0) {
      errors.teamId = 'Team ID must be a positive integer';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
