import { useState, useRef } from 'react';
import { Download, Upload, Trash2, Database } from 'lucide-react';
import { exportAllData, importAllData } from '@/utils/dataExport';
import { db } from '@/db/database';
import { useTeams } from '@/hooks/useTeams';
import { deleteTeam } from '@/db/teams';
import toast from 'react-hot-toast';

export function DataManagementView() {
  const { teams } = useTeams();
  const [showImportWarning, setShowImportWarning] = useState(false);
  const [showResetWarning, setShowResetWarning] = useState(false);
  const [showDeleteTeamWarning, setShowDeleteTeamWarning] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<{ id: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<File | null>(null);

  const handleExport = async () => {
    try {
      await exportAllData();
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
      console.error('Export error:', error);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      pendingFileRef.current = file;
      setShowImportWarning(true);
    }
    // Reset input so the same file can be selected again
    event.target.value = '';
  };

  const handleImportConfirm = async () => {
    const file = pendingFileRef.current;
    if (!file) return;

    try {
      await importAllData(file);
      toast.success('Data imported successfully');
      setShowImportWarning(false);
      pendingFileRef.current = null;
    } catch (error) {
      toast.error('Failed to import data');
      console.error('Import error:', error);
    }
  };

  const handleImportCancel = () => {
    setShowImportWarning(false);
    pendingFileRef.current = null;
  };

  const handleResetClick = () => {
    setShowResetWarning(true);
  };

  const handleResetConfirm = async () => {
    try {
      await Promise.all([
        db.teams.clear(),
        db.players.clear(),
        db.playerMatches.clear(),
        db.matches.clear(),
        db.heroes.clear(),
      ]);
      toast.success('All data has been reset');
      setShowResetWarning(false);
    } catch (error) {
      toast.error('Failed to reset data');
      console.error('Reset error:', error);
    }
  };

  const handleResetCancel = () => {
    setShowResetWarning(false);
  };

  const handleDeleteTeamClick = (teamId: string, teamName: string) => {
    setTeamToDelete({ id: teamId, name: teamName });
    setShowDeleteTeamWarning(true);
  };

  const handleDeleteTeamConfirm = async () => {
    if (!teamToDelete) return;

    try {
      await deleteTeam(teamToDelete.id);
      toast.success(`Team "${teamToDelete.name}" deleted successfully`);
      setShowDeleteTeamWarning(false);
      setTeamToDelete(null);
    } catch (error) {
      toast.error('Failed to delete team');
      console.error('Delete error:', error);
    }
  };

  const handleDeleteTeamCancel = () => {
    setShowDeleteTeamWarning(false);
    setTeamToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Data Management</h2>
        <p className="text-dota-text-secondary text-sm mt-1">
          Export, import, or reset your application data
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Export Data */}
        <div className="card">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-radiant/20 rounded-lg">
              <Upload size={24} className="text-radiant" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">Export Data</h3>
              <p className="text-dota-text-secondary text-sm mb-4">
                Download all your data as a JSON file. This includes teams, player statistics,
                match history, and hero data.
              </p>
              <button onClick={handleExport} className="btn-radiant flex items-center gap-2">
                <Upload size={18} />
                Export All Data
              </button>
            </div>
          </div>
        </div>

        {/* Import Data */}
        <div className="card">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Download size={24} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">Import Data</h3>
              <p className="text-dota-text-secondary text-sm mb-4">
                Load data from a previously exported JSON file. <strong>Warning:</strong> This will
                completely replace all existing data.
              </p>
              <button onClick={handleImportClick} className="btn-primary flex items-center gap-2">
                <Download size={18} />
                Import Data
              </button>
            </div>
          </div>
        </div>

        {/* Delete Specific Teams */}
        {teams.length > 0 && (
          <div className="card">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Trash2 size={24} className="text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">Delete Specific Teams</h3>
                <p className="text-dota-text-secondary text-sm mb-4">
                  Remove individual teams and all their associated data (player stats, hero lists, match history).
                </p>
                <div className="space-y-2">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center justify-between p-3 bg-dota-bg-tertiary rounded"
                    >
                      <div className="flex items-center gap-3">
                        {team.teamLogo && (
                          <img
                            src={team.teamLogo}
                            alt={team.name}
                            className="w-8 h-8 object-contain"
                          />
                        )}
                        <div>
                          <span className="font-medium">{team.name}</span>
                          {team.favorite && (
                            <span className="ml-2 text-xs text-yellow-400">&#9733;</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTeamClick(team.id, team.name)}
                        className="btn-secondary text-dire hover:bg-dire/20 flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reset Data */}
        <div className="card border-dire">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-dire/20 rounded-lg">
              <Trash2 size={24} className="text-dire" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1 text-dire">Reset All Data</h3>
              <p className="text-dota-text-secondary text-sm mb-4">
                Permanently delete all data from the application. This action cannot be undone.
                Make sure to export your data first if you want to keep it.
              </p>
              <button onClick={handleResetClick} className="btn-dire flex items-center gap-2">
                <Trash2 size={18} />
                Reset All Data
              </button>
            </div>
          </div>
        </div>

        {/* Data Info */}
        <div className="card bg-dota-bg-tertiary/50">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-dota-bg-secondary rounded-lg">
              <Database size={24} className="text-dota-text-secondary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">About Data Storage</h3>
              <p className="text-dota-text-secondary text-sm">
                All data is stored locally in your browser using IndexedDB. No data is sent to any
                external servers. Use the export feature regularly to backup your data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Import Warning Dialog */}
      {showImportWarning && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-dota-bg-secondary p-6 rounded-lg max-w-md w-full mx-4 border border-dota-dire">
            <h3 className="text-xl font-bold mb-4 text-dota-dire">Warning: Data Overwrite</h3>
            <p className="text-dota-text-secondary mb-4">
              Importing will <strong className="text-dota-text-primary">completely replace</strong>{' '}
              all existing data including:
            </p>
            <ul className="list-disc list-inside text-dota-text-secondary mb-6 space-y-1">
              <li>All teams (including Your Team)</li>
              <li>All player data and hero statistics</li>
              <li>All match history</li>
              <li>All manual hero lists</li>
            </ul>
            <p className="text-dota-text-secondary mb-6">
              This action cannot be undone. Make sure you have exported your current data if you
              want to keep it.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={handleImportCancel} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleImportConfirm} className="btn-dire">
                Import and Overwrite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Warning Dialog */}
      {showResetWarning && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-dota-bg-secondary p-6 rounded-lg max-w-md w-full mx-4 border border-dota-dire">
            <h3 className="text-xl font-bold mb-4 text-dota-dire">Warning: Reset All Data</h3>
            <p className="text-dota-text-secondary mb-4">
              You are about to <strong className="text-dota-text-primary">permanently delete</strong>{' '}
              all data including:
            </p>
            <ul className="list-disc list-inside text-dota-text-secondary mb-6 space-y-1">
              <li>All teams (including Your Team)</li>
              <li>All player data and hero statistics</li>
              <li>All match history</li>
              <li>All manual hero lists</li>
              <li>All hero data</li>
            </ul>
            <p className="text-dota-text-secondary mb-6 font-semibold">
              This action cannot be undone. Make sure you have exported your data if you want to
              keep it.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={handleResetCancel} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleResetConfirm} className="btn-dire">
                Reset All Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Team Warning Dialog */}
      {showDeleteTeamWarning && teamToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-dota-bg-secondary p-6 rounded-lg max-w-md w-full mx-4 border border-dota-dire">
            <h3 className="text-xl font-bold mb-4 text-dota-dire">Warning: Delete Team</h3>
            <p className="text-dota-text-secondary mb-4">
              You are about to <strong className="text-dota-text-primary">permanently delete</strong>{' '}
              the team <strong className="text-dota-text-primary">"{teamToDelete.name}"</strong> and all associated data:
            </p>
            <ul className="list-disc list-inside text-dota-text-secondary mb-6 space-y-1">
              <li>Team configuration and player roster</li>
              <li>All player hero statistics for this team</li>
              <li>Manual hero lists (if Your Team)</li>
              <li>Match history</li>
            </ul>
            <p className="text-dota-text-secondary mb-6 font-semibold">
              This action cannot be undone. Consider exporting your data first.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={handleDeleteTeamCancel} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleDeleteTeamConfirm} className="btn-dire">
                Delete Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
