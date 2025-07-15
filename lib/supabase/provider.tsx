'use client';

import { createContext, useContext } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

const SupabaseContext = createContext<SupabaseClient | undefined>(undefined);

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <SupabaseContext.Provider value={supabase}>{children}</SupabaseContext.Provider>;
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};