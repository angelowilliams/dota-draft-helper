import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import type { LobbyTypeFilter } from '@/types';
import {
  analyzeDraftState,
  selectHeroInDraft,
  createEmptyDraftState,
  type DraftAnalysis,
} from '@/services/draft';

interface DraftContextState {
  // Team selection
  firstPickTeamId: string;
  secondPickTeamId: string;

  // Draft state
  draftState: Map<number, number>;
  selectedCell: number | null;

  // Search queries
  searchQuery: string;
  firstPickSearchQuery: string;
  secondPickSearchQuery: string;

  // Filter
  lobbyTypeFilter: LobbyTypeFilter;

  // Derived state
  analysis: DraftAnalysis;
}

interface DraftContextActions {
  // Team selection
  setFirstPickTeamId: (id: string) => void;
  setSecondPickTeamId: (id: string) => void;

  // Draft actions
  selectCell: (cell: number | null) => void;
  selectHero: (heroId: number) => void;
  resetDraft: () => void;
  resetTeams: () => void;

  // Search queries
  setSearchQuery: (query: string) => void;
  setFirstPickSearchQuery: (query: string) => void;
  setSecondPickSearchQuery: (query: string) => void;

  // Filter
  setLobbyTypeFilter: (filter: LobbyTypeFilter) => void;
}

type DraftContextValue = DraftContextState & DraftContextActions;

const DraftContext = createContext<DraftContextValue | null>(null);

export function DraftProvider({ children }: { children: ReactNode }) {
  // Team selection
  const [firstPickTeamId, setFirstPickTeamId] = useState<string>('');
  const [secondPickTeamId, setSecondPickTeamId] = useState<string>('');

  // Draft state
  const [draftState, setDraftState] = useState<Map<number, number>>(createEmptyDraftState);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);

  // Search queries
  const [searchQuery, setSearchQuery] = useState('');
  const [firstPickSearchQuery, setFirstPickSearchQuery] = useState('');
  const [secondPickSearchQuery, setSecondPickSearchQuery] = useState('');

  // Filter
  const [lobbyTypeFilter, setLobbyTypeFilter] = useState<LobbyTypeFilter>('all');

  // Derived state
  const analysis = useMemo(() => analyzeDraftState(draftState), [draftState]);

  // Actions
  const selectCell = useCallback((cell: number | null) => {
    setSelectedCell(cell);
    if (cell !== null) {
      setSearchQuery('');
    }
  }, []);

  const selectHero = useCallback((heroId: number) => {
    if (selectedCell !== null) {
      setDraftState((prev) => selectHeroInDraft(prev, selectedCell, heroId));
      setSelectedCell(null);
      setSearchQuery('');
    }
  }, [selectedCell]);

  const resetDraft = useCallback(() => {
    setDraftState(createEmptyDraftState());
    setSelectedCell(null);
    setSearchQuery('');
  }, []);

  const resetTeams = useCallback(() => {
    setFirstPickTeamId('');
    setSecondPickTeamId('');
    setDraftState(createEmptyDraftState());
    setSelectedCell(null);
    setSearchQuery('');
    setFirstPickSearchQuery('');
    setSecondPickSearchQuery('');
  }, []);

  const value = useMemo<DraftContextValue>(
    () => ({
      // State
      firstPickTeamId,
      secondPickTeamId,
      draftState,
      selectedCell,
      searchQuery,
      firstPickSearchQuery,
      secondPickSearchQuery,
      lobbyTypeFilter,
      analysis,

      // Actions
      setFirstPickTeamId,
      setSecondPickTeamId,
      selectCell,
      selectHero,
      resetDraft,
      resetTeams,
      setSearchQuery,
      setFirstPickSearchQuery,
      setSecondPickSearchQuery,
      setLobbyTypeFilter,
    }),
    [
      firstPickTeamId,
      secondPickTeamId,
      draftState,
      selectedCell,
      searchQuery,
      firstPickSearchQuery,
      secondPickSearchQuery,
      lobbyTypeFilter,
      analysis,
      selectCell,
      selectHero,
      resetDraft,
      resetTeams,
    ]
  );

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraft(): DraftContextValue {
  const context = useContext(DraftContext);
  if (!context) {
    throw new Error('useDraft must be used within a DraftProvider');
  }
  return context;
}
