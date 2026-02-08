import { useState, useEffect } from 'react';
import { X, Download, AlertCircle, Loader2, Check } from 'lucide-react';
import { parseAD2LPage } from '@/utils/ad2lParser';
import { detectTeamsForPlayers } from '@/services/teamDetection';
import type { CandidateTeam } from '@/services/teamDetection';
import type { Team } from '@/types';

interface AD2LImportModalProps {
  onImport: (teamData: Omit<Team, 'id' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
}

export function AD2LImportModal({ onImport, onCancel }: AD2LImportModalProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualHtml, setManualHtml] = useState('');
  const [teamData, setTeamData] = useState<{
    name: string;
    playerIds: string[];
    altAccountMap: Record<string, string[]>;
  } | null>(null);

  // Team detection state
  const [teamCandidates, setTeamCandidates] = useState<CandidateTeam[]>([]);
  const [teamDetectionStatus, setTeamDetectionStatus] = useState<
    'idle' | 'loading' | 'found' | 'none' | 'error'
  >('idle');
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  // Auto-detect team when teamData is set
  useEffect(() => {
    if (!teamData || teamData.playerIds.length === 0) return;

    let cancelled = false;
    setTeamDetectionStatus('loading');
    setTeamCandidates([]);
    setSelectedTeamId(null);

    detectTeamsForPlayers(teamData.playerIds).then((result) => {
      if (cancelled) return;

      setTeamCandidates(result.candidates);
      setTeamDetectionStatus(result.status === 'error' ? 'error' : result.candidates.length > 0 ? 'found' : 'none');

      // Auto-select top candidate if 3+ players match
      if (result.candidates.length > 0 && result.candidates[0].matchingPlayers >= 3) {
        setSelectedTeamId(result.candidates[0].teamId);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [teamData]);

  const processHtml = (html: string) => {
    const parsed = parseAD2LPage(html);

    if (parsed.playerIds.length === 0) {
      setError('No players found. Make sure you copied the entire page HTML.');
      return;
    }

    if (parsed.playerIds.length > 5) {
      // Limit to first 5 players
      parsed.playerIds = parsed.playerIds.slice(0, 5);
    }

    setTeamData(parsed);
  };

  const handleFetch = async () => {
    if (!url.trim()) {
      setError('Please enter a valid AD2L team URL');
      return;
    }

    // Validate URL format
    if (!url.includes('dota.playon.gg/teams/')) {
      setError('Invalid AD2L URL. Expected format: https://dota.playon.gg/teams/[team-id]');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Extract the path from the AD2L URL and proxy through Vite dev server
      const urlObj = new URL(url);
      const proxyUrl = `/api/ad2l${urlObj.pathname}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch team page: ${response.statusText}`);
      }

      const html = await response.text();
      processHtml(html);
    } catch (err) {
      console.error('Failed to import team:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch. Try using "Paste HTML" instead.');
      setShowManualInput(true);
    } finally {
      setLoading(false);
    }
  };

  const handleManualParse = () => {
    if (!manualHtml.trim()) {
      setError('Please paste the HTML content');
      return;
    }

    setError(null);
    processHtml(manualHtml);
  };

  const handleImport = async () => {
    if (!teamData) return;

    try {
      const altAccountMap = Object.keys(teamData.altAccountMap).length > 0
        ? teamData.altAccountMap
        : undefined;

      await onImport({
        name: teamData.name,
        playerIds: teamData.playerIds,
        ...(selectedTeamId != null && { teamId: String(selectedTeamId) }),
        ...(altAccountMap && { altAccountMap }),
      });
      onCancel();
    } catch (err) {
      console.error('Failed to create team:', err);
      setError(err instanceof Error ? `Failed to create team: ${err.message}` : 'Failed to create team');
    }
  };

  const handleReset = () => {
    setTeamData(null);
    setManualHtml('');
    setShowManualInput(false);
    setError(null);
    setTeamCandidates([]);
    setTeamDetectionStatus('idle');
    setSelectedTeamId(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Import Team from AD2L</h3>
          <button
            onClick={onCancel}
            className="text-dota-text-secondary hover:text-dota-text-primary"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {/* URL Input */}
          {!showManualInput && (
            <div>
              <label className="block text-sm font-medium mb-2">
                AD2L Team URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://dota.playon.gg/teams/14589"
                  className="input-field flex-1"
                  disabled={loading || teamData !== null}
                />
                {!teamData && (
                  <button
                    onClick={handleFetch}
                    disabled={loading}
                    className="btn-radiant flex items-center gap-2 whitespace-nowrap"
                  >
                    <Download size={18} />
                    {loading ? 'Fetching...' : 'Fetch'}
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-dota-text-muted">
                  Enter the URL of an AD2L team page to import player roster
                </p>
                {!teamData && (
                  <button
                    onClick={() => setShowManualInput(true)}
                    className="text-xs text-radiant hover:text-radiant-light"
                  >
                    or Paste HTML
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Manual HTML Input */}
          {showManualInput && !teamData && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Paste Page HTML
              </label>
              <textarea
                value={manualHtml}
                onChange={(e) => setManualHtml(e.target.value)}
                placeholder="Paste the HTML content from the AD2L team page here..."
                className="input-field w-full h-32 font-mono text-xs"
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-dota-text-muted">
                  Right-click on page → Inspect → Copy HTML of &lt;body&gt; element
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowManualInput(false);
                      setManualHtml('');
                    }}
                    className="text-xs text-dota-text-secondary hover:text-dota-text-primary"
                  >
                    Back to URL
                  </button>
                  <button
                    onClick={handleManualParse}
                    className="btn-radiant text-xs px-3 py-1"
                  >
                    Parse HTML
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-dire/20 border border-dire rounded p-3 flex items-start gap-2">
              <AlertCircle size={20} className="text-dire flex-shrink-0 mt-0.5" />
              <p className="text-sm text-dire">{error}</p>
            </div>
          )}

          {/* Preview Imported Data */}
          {teamData && (
            <div className="space-y-4">
              <div className="bg-dota-bg-tertiary rounded p-4">
                <h4 className="font-semibold mb-2">Preview</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-dota-text-secondary">Team Name: </span>
                    <span className="font-medium">{teamData.name}</span>
                  </div>
                  <div>
                    <span className="text-sm text-dota-text-secondary">Players Found: </span>
                    <span className="font-medium">{teamData.playerIds.length} / 5</span>
                  </div>
                  <div className="mt-3">
                    <span className="text-sm text-dota-text-secondary block mb-1">Steam IDs:</span>
                    <div className="space-y-1">
                      {teamData.playerIds.map((id, idx) => (
                        <div key={idx}>
                          <div className="text-sm font-mono">
                            {idx + 1}. {id || <span className="text-dota-text-muted italic">Empty</span>}
                          </div>
                          {teamData.altAccountMap[id]?.map((altId, altIdx) => (
                            <div key={altIdx} className="text-sm font-mono text-dota-text-secondary ml-6">
                              ↳ {altId}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Detection Section */}
              <div className="bg-dota-bg-tertiary rounded p-4">
                <h4 className="font-semibold mb-2">OpenDota Team ID</h4>

                {teamDetectionStatus === 'loading' && (
                  <div className="flex items-center gap-2 text-sm text-dota-text-secondary">
                    <Loader2 size={16} className="animate-spin" />
                    Detecting OpenDota team ID...
                  </div>
                )}

                {teamDetectionStatus === 'found' && (
                  <div className="space-y-2">
                    <p className="text-xs text-dota-text-muted mb-2">
                      Select a team to link (enables logo and competitive match history):
                    </p>
                    {teamCandidates.map((candidate) => (
                      <button
                        key={candidate.teamId}
                        onClick={() =>
                          setSelectedTeamId(
                            selectedTeamId === candidate.teamId ? null : candidate.teamId
                          )
                        }
                        className={`w-full flex items-center gap-3 p-2 rounded border transition-colors ${
                          selectedTeamId === candidate.teamId
                            ? 'border-radiant bg-radiant/10'
                            : 'border-dota-border hover:border-dota-text-secondary'
                        }`}
                      >
                        {candidate.logoUrl ? (
                          <img
                            src={candidate.logoUrl}
                            alt={candidate.name}
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-dota-bg-secondary rounded flex items-center justify-center text-xs text-dota-text-muted">
                            ?
                          </div>
                        )}
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium">
                            {candidate.name}
                            {candidate.tag && (
                              <span className="text-dota-text-secondary ml-1">
                                [{candidate.tag}]
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-dota-text-muted">
                            {candidate.matchingPlayers} player{candidate.matchingPlayers !== 1 ? 's' : ''} matched
                          </div>
                        </div>
                        {selectedTeamId === candidate.teamId && (
                          <Check size={16} className="text-radiant" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {teamDetectionStatus === 'none' && (
                  <p className="text-xs text-dota-text-muted">
                    No OpenDota team ID detected. You can add one manually later.
                  </p>
                )}

                {teamDetectionStatus === 'error' && (
                  <p className="text-xs text-dota-text-muted">
                    Could not detect team ID. You can add one manually later.
                  </p>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleReset}
                  className="btn-secondary"
                >
                  Reset
                </button>
                <button
                  onClick={handleImport}
                  className="btn-radiant"
                >
                  Import Team
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
