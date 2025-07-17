import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { useCodeFiles } from './useCodeFiles';

interface UseAutoSaveProps {
  html: string;
  css: string;
  javascript: string;
  interval?: number;
  enabled?: boolean;
}

export const useAutoSave = ({ 
  html, 
  css, 
  javascript, 
  interval = 30000, // 30 seconds
  enabled = true 
}: UseAutoSaveProps) => {
  const { user } = useAuth();
  const { saveCodeFile } = useCodeFiles();
  const [lastSaveTime, setLastSaveTime] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastContentRef = useRef<string>('');

  // Create a hash of current content to detect changes
  const createContentHash = (h: string, c: string, j: string) => {
    return btoa(h + c + j).slice(0, 16);
  };

  const performAutoSave = async () => {
    if (!user || !enabled) return;

    const currentHash = createContentHash(html, css, javascript);
    
    // Only save if content has changed
    if (currentHash === lastContentRef.current) return;

    setIsSaving(true);
    try {
      const timestamp = new Date().toISOString();
      const title = `Auto-save ${new Date().toLocaleString()}`;
      
      // Save each language separately
      if (html.trim()) {
        await saveCodeFile(html, 'html', `${title} - HTML`);
      }
      if (css.trim()) {
        await saveCodeFile(css, 'css', `${title} - CSS`);
      }
      if (javascript.trim()) {
        await saveCodeFile(javascript, 'javascript', `${title} - JavaScript`);
      }

      lastContentRef.current = currentHash;
      setLastSaveTime(timestamp);
      
      // Dispatch custom event for UI feedback
      window.dispatchEvent(new CustomEvent('autosave', { 
        detail: { timestamp } 
      }));
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save effect
  useEffect(() => {
    if (!enabled || !user) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(performAutoSave, interval);

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [html, css, javascript, interval, enabled, user]);

  // Manual save function
  const manualSave = async (title?: string) => {
    if (!user) return { error: 'User not authenticated' };

    setIsSaving(true);
    try {
      const timestamp = new Date().toISOString();
      const saveTitle = title || `Manual save ${new Date().toLocaleString()}`;
      
      const results = [];
      
      if (html.trim()) {
        const result = await saveCodeFile(html, 'html', `${saveTitle} - HTML`);
        results.push(result);
      }
      if (css.trim()) {
        const result = await saveCodeFile(css, 'css', `${saveTitle} - CSS`);
        results.push(result);
      }
      if (javascript.trim()) {
        const result = await saveCodeFile(javascript, 'javascript', `${saveTitle} - JavaScript`);
        results.push(result);
      }

      const hasError = results.some(r => r.error);
      if (!hasError) {
        const currentHash = createContentHash(html, css, javascript);
        lastContentRef.current = currentHash;
        setLastSaveTime(timestamp);
      }

      return { error: hasError ? 'Some files failed to save' : null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Save failed' };
    } finally {
      setIsSaving(false);
    }
  };

  return {
    lastSaveTime,
    isSaving,
    manualSave,
    performAutoSave
  };
};