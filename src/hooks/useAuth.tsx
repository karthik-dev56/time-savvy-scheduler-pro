
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session, AuthError } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setAuthError(null);
    // Clear special admin session if it exists
    if (sessionStorage.getItem('specialAdminSession')) {
      sessionStorage.removeItem('specialAdminSession');
      setUser(null);
      setSession(null);
      return;
    }
    await supabase.auth.signOut();
  };

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    try {
      // Check for special admin user (this is a client-side check only for demonstration)
      // In a real app, this should be handled securely on the backend
      if (email === "k8716610@gmail.com" && password === "9848+-ab") {
        console.log("Special admin login detected");
        
        // Create a special admin session object
        const specialAdminUser = {
          id: 'admin-special',
          email: email,
          role: 'admin',
          app_metadata: { role: 'admin' },
          user_metadata: { role: 'admin' }
        };
        
        // Store in sessionStorage to persist across page refreshes
        sessionStorage.setItem('specialAdminSession', JSON.stringify(specialAdminUser));
        
        // Set the user in state
        setUser(specialAdminUser as any);
        
        return { success: true, data: { user: specialAdminUser } };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Sign in error:", error.message);
        setAuthError(error.message);
        return { success: false, error };
      }
      
      return { success: true, data };
    } catch (error: any) {
      console.error("Unexpected sign in error:", error);
      setAuthError(error.message || "An unexpected error occurred");
      return { success: false, error };
    }
  };

  const signUp = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        console.error("Sign up error:", error.message);
        setAuthError(error.message);
        return { success: false, error };
      }
      
      return { success: true, data };
    } catch (error: any) {
      console.error("Unexpected sign up error:", error);
      setAuthError(error.message || "An unexpected error occurred");
      return { success: false, error };
    }
  };

  // Check for special admin session on init
  useEffect(() => {
    const specialAdminSession = sessionStorage.getItem('specialAdminSession');
    if (specialAdminSession && !user) {
      const adminUser = JSON.parse(specialAdminSession);
      setUser(adminUser as any);
      setLoading(false);
    }
  }, [user]);

  return {
    user,
    session,
    loading,
    authError,
    signIn,
    signUp,
    signOut,
  };
}
