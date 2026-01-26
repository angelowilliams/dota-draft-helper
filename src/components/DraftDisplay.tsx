import { getHeroPortraitUrl } from '@/config/heroes';
import { CAPTAIN_MODE_DRAFT_ORDER } from '@/config/draftOrder';
import type { Hero, Match } from '@/types';

interface DraftDisplayProps {
  match: Match;
  heroes: Hero[];
  isRadiant: boolean;
  teamName: string;
  opponentName: string;
}

export function DraftDisplay({ match, heroes, isRadiant, teamName, opponentName }: DraftDisplayProps) {
  const getHeroName = (heroId: number): string => {
    return heroes.find((h) => h.id === heroId)?.displayName || `Hero ${heroId}`;
  };

  // Determine which team had first pick
  let radiantIsFirstPick = true;
  if (match.pickBans && match.pickBans.length > 0) {
    const firstAction = match.pickBans.sort((a, b) => a.order - b.order)[0];
    radiantIsFirstPick = firstAction.isRadiant;
  }

  const firstPickSide = radiantIsFirstPick ? 'radiant' : 'dire';
  const secondPickSide = radiantIsFirstPick ? 'dire' : 'radiant';

  // Build draft data for both teams
  const radiantActions: Array<{
    heroId: number;
    type: 'ban' | 'pick';
    order: number;
    position: number;
  }> = [];

  const direActions: Array<{
    heroId: number;
    type: 'ban' | 'pick';
    order: number;
    position: number;
  }> = [];

  let radiantPosition = 0;
  let direPosition = 0;

  CAPTAIN_MODE_DRAFT_ORDER.forEach((phase) => {
    const isFirstPickAction = phase.team === 'firstPick';
    const actionTeamSide = isFirstPickAction ? firstPickSide : secondPickSide;
    const teamDraft = actionTeamSide === 'radiant' ? match.radiantDraft : match.direDraft;

    // Count how many of this type we've already added for this team
    const existingActions = actionTeamSide === 'radiant' ? radiantActions : direActions;
    const countSameType = existingActions.filter((d) => d.type === phase.type).length;

    // Get the hero at this index
    const heroArray = phase.type === 'pick' ? teamDraft.picks : teamDraft.bans;
    const heroId = heroArray[countSameType];

    if (heroId !== undefined) {
      if (actionTeamSide === 'radiant') {
        radiantActions.push({
          heroId,
          type: phase.type,
          order: phase.order,
          position: radiantPosition,
        });
        radiantPosition++;
      } else {
        direActions.push({
          heroId,
          type: phase.type,
          order: phase.order,
          position: direPosition,
        });
        direPosition++;
      }
    }
  });

  // Radiant always first, Dire always second
  const radiantLabel = isRadiant ? teamName : opponentName;
  const direLabel = isRadiant ? opponentName : teamName;

  return (
    <div>
      {/* Two equal rows for draft actions */}
      <div className="space-y-2">
        {/* Radiant Row */}
        <div>
          <div className="text-sm font-semibold text-radiant mb-1">
            {radiantLabel}
          </div>
          <div className="flex gap-2">
            {radiantActions.map((action, index) => {
              const isBan = action.type === 'ban';

              return (
                <div key={index} className="relative flex-shrink-0">
                  <img
                    src={getHeroPortraitUrl(action.heroId)}
                    alt={getHeroName(action.heroId)}
                    title={`#${action.order} ${isBan ? 'Ban' : 'Pick'}: ${getHeroName(action.heroId)}`}
                    className={`rounded ${isBan ? 'opacity-50 grayscale' : 'border-2 border-radiant'}`}
                    style={{ width: 'auto', height: 'auto', maxWidth: '56px' }}
                  />
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-radiant text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-md">
                    {action.order}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dire Row */}
        <div>
          <div className="text-sm font-semibold text-dire mb-1">
            {direLabel}
          </div>
          <div className="flex gap-2">
            {direActions.map((action, index) => {
              const isBan = action.type === 'ban';

              return (
                <div key={index} className="relative flex-shrink-0">
                  <img
                    src={getHeroPortraitUrl(action.heroId)}
                    alt={getHeroName(action.heroId)}
                    title={`#${action.order} ${isBan ? 'Ban' : 'Pick'}: ${getHeroName(action.heroId)}`}
                    className={`rounded ${isBan ? 'opacity-50 grayscale' : 'border-2 border-dire'}`}
                    style={{ width: 'auto', height: 'auto', maxWidth: '56px' }}
                  />
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-dire text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-md">
                    {action.order}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
