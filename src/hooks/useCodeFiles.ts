import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CodeFile } from '../lib/database.types';
import { useAuth } from './useAuth';

export const useCodeFiles = () => {
  const { user } = useAuth();
  const [codeFiles, setCodeFiles] = useState<CodeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCodeFiles();
    } else {
      setCodeFiles([]);
      setLoading(false);
    }
  }, [user]);

  const fetchCodeFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('code_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCodeFiles(data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch code files');
    } finally {
      setLoading(false);
    }
  };

  const saveCodeFile = async (
    codeContent: string,
    language: 'html' | 'css' | 'javascript',
    title: string
  ) => {
    if (!user) return { data: null, error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('code_files')
        .insert({
          user_id: user.id,
          code_content: codeContent,
          language,
          title
        })
        .select()
        .single();

      if (error) throw error;

      await fetchCodeFiles();
      return { data, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save code file';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    }
  };

  const updateCodeFile = async (id: string, updates: Partial<CodeFile>) => {
    try {
      const { data, error } = await supabase
        .from('code_files')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await fetchCodeFiles();
      return { data, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update code file';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    }
  };

  const deleteCodeFile = async (id: string) => {
    try {
      const { error } = await supabase
        .from('code_files')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchCodeFiles();
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete code file';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const getCodeFilesByLanguage = (language: 'html' | 'css' | 'javascript') => {
    return codeFiles.filter(file => file.language === language);
  };

  return {
    codeFiles,
    loading,
    error,
    saveCodeFile,
    updateCodeFile,
    deleteCodeFile,
    getCodeFilesByLanguage,
    refetch: fetchCodeFiles
  };
};