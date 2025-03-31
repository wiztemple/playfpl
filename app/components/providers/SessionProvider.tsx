'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

// Create a context for the Supabase session
type SupabaseContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

const SupabaseContext = createContext<SupabaseContextType>({
  session: null,
  user: null,
  loading: true,
});

// Custom hook to use the Supabase session
export const useSupabaseSession = () => useContext(SupabaseContext);

export default function SessionProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        setLoading(true);
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user || null);
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);
        setLoading(false);
      }
    );

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SupabaseContext.Provider value={{ session, user, loading }}>
      {children}
    </SupabaseContext.Provider>
  );
}