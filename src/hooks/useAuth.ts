import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { auth } from '../lib/supabase';
import { Profile } from '../lib/database.types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  return {
    user: { id: 'mock-user-id' }, // Mock user object
    profile: { id: 'mock-user-id', full_name: 'Guest User' }, // Mock profile
    session: null,
    loading: false,
    error: null,
    isAuthenticated: true, // Always authenticated
    signIn: async () => {},
    signOut: async () => {},
    signUp: async () => {},
    signInWithGoogle: async () => {},
    signInWithGitHub: async () => {},
    updateProfile: async () => {},
  };
};