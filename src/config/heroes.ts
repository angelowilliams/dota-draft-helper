// Hero utility functions

export function getHeroPortraitUrl(heroId: number): string {
  return `/heroes/${heroId}.png`;
}

export function getHeroIconUrl(heroId: number): string {
  return `/heroes/${heroId}_icon.png`;
}
