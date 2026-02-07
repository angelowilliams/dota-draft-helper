import { useState, useEffect } from 'react';
import { Trophy, Calendar, RefreshCw } from 'lucide-react';
import { DraftDisplay } from './DraftDisplay';
import { fetchTeamMatches } from '@/api/matches';
import { format } from 'date-fns';
import type { Match, Hero } from '@/types';

interface MatchHistoryProps {
  teamId: string;
  teamName: string;
  playerIds: string[];
  heroes: Hero[];
}

export function MatchHistory({ teamId, teamName, playerIds, heroes }: MatchHistoryProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const playerIdsKey = playerIds.join(',');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!teamId || teamId.trim().length === 0) {
          throw new Error('Team ID is required');
        }

        const teamIdNum = parseInt(teamId, 10);
        if (isNaN(teamIdNum) || teamIdNum <= 0) {
          throw new Error('Invalid team ID format');
        }

        const fetchedMatches = await fetchTeamMatches({
          teamId: teamIdNum,
          playerIds,
          limit: 10,
        });

        if (cancelled) return;

        if (!Array.isArray(fetchedMatches)) {
          throw new Error('Invalid response from API');
        }

        setMatches(fetchedMatches);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to fetch matches';
        setError(message);
        console.error('Error fetching matches:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [teamId, playerIdsKey, refreshCount]);

  if (loading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Trophy size={20} />
          Recent Competitive Matches
        </h3>
        <div className="text-center py-8 text-dota-text-secondary">
          <p>Loading matches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-dire bg-opacity-20 border-dire">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Trophy size={20} />
          Recent Competitive Matches
        </h3>
        <p className="text-dire">Error: {error}</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Trophy size={20} />
          Recent Competitive Matches
        </h3>
        <div className="text-center py-8 text-dota-text-secondary">
          <p>No competitive matches found for this team</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Trophy size={20} />
          Recent Competitive Matches for {teamName}
        </h3>
        <button
          onClick={() => setRefreshCount((c) => c + 1)}
          disabled={loading}
          className="btn-radiant flex items-center gap-2"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Loading...' : 'Refresh Matches'}
        </button>
      </div>

      <div className="space-y-4">
        {matches.map((match) => {
          // Determine side: check team ID first, then team name
          const isRadiant =
            match.radiantTeamId?.toString() === teamId ||
            (!match.radiantTeamId && match.radiantTeamName === teamName);
          const won = isRadiant ? match.didRadiantWin : !match.didRadiantWin;
          const opponentName =
            (isRadiant ? match.direTeamName : match.radiantTeamName) || 'Unknown Team';

          return (
            <div
              key={match.matchId}
              className={`border rounded-lg p-4 ${
                won
                  ? 'border-radiant bg-radiant bg-opacity-10'
                  : 'border-dire bg-dire bg-opacity-10'
              }`}
            >
              {/* Match Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`font-semibold ${
                        won ? 'text-radiant' : 'text-dire'
                      }`}
                    >
                      {won ? 'VICTORY' : 'DEFEAT'}
                    </span>
                    <span className="text-dota-text-muted">•</span>
                    <span className="text-sm text-dota-text-secondary">
                      {isRadiant ? 'Radiant' : 'Dire'}
                    </span>
                  </div>
                  {match.leagueName && (
                    <p className="text-sm text-dota-text-secondary">
                      {match.leagueName}
                    </p>
                  )}
                </div>
                <div className="text-right text-sm text-dota-text-muted">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    {format(match.startDateTime, 'MMM d, yyyy')}
                  </div>
                  <div>{format(match.startDateTime, 'h:mm a')}</div>
                </div>
              </div>

              {/* Draft Display - Horizontal Chronological Format */}
              <DraftDisplay
                match={match}
                heroes={heroes}
                isRadiant={isRadiant}
                teamName={teamName}
                opponentName={opponentName}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
