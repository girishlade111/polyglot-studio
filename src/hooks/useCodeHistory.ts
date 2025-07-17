import { useState, useCallback } from 'react';

interface CodeState {
  html: string;
  css: string;
  javascript: string;
}

interface HistoryEntry {
  id: string;
  state: CodeState;
  timestamp: string;
  description: string;
}

export const useCodeHistory = (initialState: CodeState) => {
  const [history, setHistory] = useState<HistoryEntry[]>([
    {
      id: 'initial',
      state: initialState,
      timestamp: new Date().toISOString(),
      description: 'Initial state'
    }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const saveState = useCallback((state: CodeState, description: string = 'Code change') => {
    const newEntry: HistoryEntry = {
      id: Date.now().toString(),
      state: { ...state },
      timestamp: new Date().toISOString(),
      description
    };

    setHistory(prev => {
      // Remove any entries after current index (when undoing then making new changes)
      const newHistory = prev.slice(0, currentIndex + 1);
      return [...newHistory, newEntry];
    });
    
    setCurrentIndex(prev => prev + 1);
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      return history[currentIndex - 1].state;
    }
    return null;
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return history[currentIndex + 1].state;
    }
    return null;
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;
  const currentState = history[currentIndex]?.state || initialState;

  return {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    currentState,
    history: history.slice(0, currentIndex + 1) // Only show history up to current point
  };
};