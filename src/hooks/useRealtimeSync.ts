import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface RealtimeSyncOptions {
  projectId: string;
  onCodeUpdate: (html: string, css: string, js: string) => void;
  debounceMs?: number;
}

export const useRealtimeSync = ({ 
  projectId, 
  onCodeUpdate, 
  debounceMs = 1000 
}: RealtimeSyncOptions) => {
  const { user } = useAuth();
  const debounceRef = useRef<NodeJS.Timeout>();
  const channelRef = useRef<any>();

  useEffect(() => {
    if (!user || !projectId) return;

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`project-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'code_snippets',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          const newSnippet = payload.new;
          onCodeUpdate(
            newSnippet.html_content,
            newSnippet.css_content,
            newSnippet.js_content
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'code_snippets',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          const updatedSnippet = payload.new;
          onCodeUpdate(
            updatedSnippet.html_content,
            updatedSnippet.css_content,
            updatedSnippet.js_content
          );
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, projectId, onCodeUpdate]);

  const syncCode = async (html: string, css: string, js: string) => {
    if (!user || !projectId) return;

    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the sync operation
    debounceRef.current = setTimeout(async () => {
      try {
        // Update the latest code snippet
        const { data: latestSnippet } = await supabase
          .from('code_snippets')
          .select('id')
          .eq('project_id', projectId)
          .order('version', { ascending: false })
          .limit(1)
          .single();

        if (latestSnippet) {
          await supabase
            .from('code_snippets')
            .update({
              html_content: html,
              css_content: css,
              js_content: js
            })
            .eq('id', latestSnippet.id);
        }
      } catch (error) {
        console.error('Failed to sync code:', error);
      }
    }, debounceMs);
  };

  const cleanup = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
  };

  return { syncCode, cleanup };
};