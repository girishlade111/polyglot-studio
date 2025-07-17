import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Project, CodeSnippet } from '../lib/database.types';
import { useAuth } from './useAuth';

interface ProjectWithCode extends Project {
  code_snippets?: CodeSnippet[];
}

export const useProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectWithCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      setProjects([]);
      setLoading(false);
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          code_snippets (*)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (title: string, description?: string) => {
    if (!user) return { data: null, error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title,
          description
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial code snippet
      const { error: codeError } = await supabase
        .from('code_snippets')
        .insert({
          project_id: data.id,
          html_content: '',
          css_content: '',
          js_content: ''
        });

      if (codeError) throw codeError;

      await fetchProjects();
      return { data, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await fetchProjects();
      return { data, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update project';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchProjects();
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const saveCode = async (projectId: string, html: string, css: string, js: string) => {
    try {
      // Get current code snippet for the project
      const { data: existingSnippet } = await supabase
        .from('code_snippets')
        .select('*')
        .eq('project_id', projectId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      const newVersion = existingSnippet ? existingSnippet.version + 1 : 1;

      const { data, error } = await supabase
        .from('code_snippets')
        .insert({
          project_id: projectId,
          html_content: html,
          css_content: css,
          js_content: js,
          version: newVersion
        })
        .select()
        .single();

      if (error) throw error;

      // Update project's updated_at timestamp
      await supabase
        .from('projects')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', projectId);

      await fetchProjects();
      return { data, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save code';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    }
  };

  const getProjectCode = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('code_snippets')
        .select('*')
        .eq('project_id', projectId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get project code';
      return { data: null, error: errorMessage };
    }
  };

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    saveCode,
    getProjectCode,
    refetch: fetchProjects
  };
};