import { useState } from 'react';
import { X, Download, AlertCircle } from 'lucide-react';
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
  } | null>(null);

  const parseAD2LPage = (html: string): { name: string; playerIds: string[] } => {
    // Create a temporary DOM element to parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract team name - look for the team header
    let teamName = 'Imported Team';
    const h1Elements = doc.querySelectorAll('h1');
    for (const h1 of h1Elements) {
      const text = h1.textContent?.trim();
      if (text && text.length > 0 && !text.includes('League') && !text.includes('Season')) {
        teamName = text;
        break;
      }
    }

    // Find all rosterNameContainer elements (excluding rosterNameContainer-alt)
    const rosterContainers = doc.querySelectorAll('.rosterNameContainer:not(.rosterNameContainer-alt)');
    const playerIds: string[] = [];
    const seenIds = new Set<string>();

    rosterContainers.forEach((container) => {
      // Look for various links that contain Steam IDs
      const links = container.querySelectorAll('a[href]');

      for (const link of links) {
        const href = link.getAttribute('href') || '';
        let steamId: string | null = null;

        // Check for steam://friends/add/[steamID]
        const steamFriendMatch = href.match(/steam:\/\/friends\/add\/(\d+)/);
        if (steamFriendMatch) {
          steamId = steamFriendMatch[1];
        }

        // Check for Stratz URLs: https://stratz.com/players/[steamID32]
        const stratzMatch = href.match(/stratz\.com\/players\/(\d+)/);
        if (stratzMatch && !steamId) {
          steamId = stratzMatch[1]; // This is Steam32, which is what we want
        }

        // Check for OpenDota URLs: https://www.opendota.com/players/[steamID32]
        const opendotaMatch = href.match(/opendota\.com\/players\/(\d+)/);
        if (opendotaMatch && !steamId) {
          steamId = opendotaMatch[1]; // This is Steam32
        }

        // Check for Dotabuff URLs: https://www.dotabuff.com/players/[steamID32]
        const dotabuffMatch = href.match(/dotabuff\.com\/players\/(\d+)/);
        if (dotabuffMatch && !steamId) {
          steamId = dotabuffMatch[1]; // This is Steam32
        }

        // Check for Steam Community profile: https://steamcommunity.com/profiles/[steamID64]
        const steamProfileMatch = href.match(/steamcommunity\.com\/profiles\/(\d+)/);
        if (steamProfileMatch && !steamId) {
          steamId = steamProfileMatch[1]; // This is Steam64
        }

        // If we found a Steam ID and haven't seen it yet, add it
        if (steamId && !seenIds.has(steamId)) {
          playerIds.push(steamId);
          seenIds.add(steamId);
          break; // Move to next container
        }
      }
    });

    return { name: teamName, playerIds };
  };

  const processHtml = (html: string) => {
    const parsed = parseAD2LPage(html);

    if (parsed.playerIds.length === 0) {
      setError('No players found. Make sure you copied the entire page HTML.');
      return;
    }

    if (parsed.playerIds.length > 5) {
      // Limit to first 5 players
      parsed.playerIds = parsed.playerIds.slice(0, 5);
    } else if (parsed.playerIds.length < 5) {
      // Pad with empty strings
      while (parsed.playerIds.length < 5) {
        parsed.playerIds.push('');
      }
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
      // Try to fetch with mode: 'cors' to see if CORS is allowed
      const response = await fetch(url, { mode: 'cors' });

      if (!response.ok) {
        throw new Error(`Failed to fetch team page: ${response.statusText}`);
      }

      const html = await response.text();
      processHtml(html);
    } catch (err) {
      console.error('Failed to import team:', err);

      // Check if it's a CORS error
      if (err instanceof TypeError && err.message.includes('CORS')) {
        setError('CORS blocked the request. Please use the "Paste HTML" option below.');
        setShowManualInput(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch. Try using "Paste HTML" instead.');
        setShowManualInput(true);
      }
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
      await onImport({
        name: teamData.name,
        playerIds: teamData.playerIds,
      });
      onCancel();
    } catch (err) {
      setError('Failed to create team');
    }
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
                    <span className="font-medium">{teamData.playerIds.filter(id => id).length} / 5</span>
                  </div>
                  <div className="mt-3">
                    <span className="text-sm text-dota-text-secondary block mb-1">Steam IDs:</span>
                    <div className="space-y-1">
                      {teamData.playerIds.map((id, idx) => (
                        <div key={idx} className="text-sm font-mono">
                          {idx + 1}. {id || <span className="text-dota-text-muted italic">Empty</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setTeamData(null);
                    setManualHtml('');
                    setShowManualInput(false);
                    setError(null);
                  }}
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
