import type { LobbyTypeFilter } from '@/types';

interface LobbyTypeToggleProps {
  value: LobbyTypeFilter;
  onChange: (value: LobbyTypeFilter) => void;
}

export function LobbyTypeToggle({ value, onChange }: LobbyTypeToggleProps) {
  return (
    <div className="inline-flex rounded-lg border-2 border-dota-bg-tertiary bg-dota-bg-primary overflow-hidden">
      <button
        onClick={() => onChange('all')}
        className={`px-6 py-2 text-sm font-semibold transition-all ${
          value === 'all'
            ? 'bg-radiant text-black shadow-lg'
            : 'bg-transparent text-dota-text-secondary hover:text-dota-text-primary hover:bg-dota-bg-tertiary'
        }`}
      >
        All Games
      </button>
      <button
        onClick={() => onChange('competitive')}
        className={`px-6 py-2 text-sm font-semibold transition-all border-l-2 border-dota-bg-tertiary ${
          value === 'competitive'
            ? 'bg-radiant text-black shadow-lg'
            : 'bg-transparent text-dota-text-secondary hover:text-dota-text-primary hover:bg-dota-bg-tertiary'
        }`}
      >
        Competitive
      </button>
    </div>
  );
}
