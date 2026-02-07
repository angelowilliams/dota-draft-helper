import { Search } from 'lucide-react';

interface HeroSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function HeroSearchInput({
  value,
  onChange,
  placeholder = 'Filter heroes...',
  className = 'w-48',
}: HeroSearchInputProps) {
  return (
    <div className="flex items-center gap-2">
      <Search size={16} className="text-dota-text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`input-field ${className}`}
      />
    </div>
  );
}
