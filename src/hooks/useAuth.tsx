
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session, AuthError } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check for special admin session first to avoid unnecessary Supabase calls
    const checkSpecialAdminSession = () => {
      const specialAdminSession = sessionStorage.getItem('specialAdminSession');
      if (specialAdminSession) {
        try {
          console.log("Found special admin session");
          const adminUser = JSON.parse(specialAdminSession);
          
          // Validate that this is a proper admin object
          if (!adminUser || !adminUser.id || adminUser.id === "") {
            console.warn("Invalid admin session found, removing");
            sessionStorage.removeItem('specialAdminSession');
            return false;
          }
          
          setUser(adminUser);
          setSession({
            access_token: 'admin-token',
            refresh_token: 'admin-refresh',
            user: adminUser,
            expires_at: Date.now() + 3600,
            expires_in: 3600
          } as any);
          setLoading(false);
          return true;
        } catch (error) {
          console.error("Invalid admin session data:", error);
          // Continue with normal auth flow if parsing fails
          sessionStorage.removeItem('specialAdminSession');
          return false;
        }
      }
      return false;
    };
    
    // First try the special admin session
    const hasAdminSession = checkSpecialAdminSession();
    if (hasAdminSession) {
      return; // Exit early if special admin session exists and is valid
    }

    // Set up auth state listener if not admin session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Then check for existing session
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
      // Check for special admin user
      if (email === "k8716610@gmail.com" && password === "9848+-ab") {
        console.log("Special admin login detected");
        
        // Create a proper admin user object with valid format and UUID
        const adminUser = {
          id: "00000000-0000-0000-0000-000000000000", // Use a valid UUID format
          email: email,
          role: 'admin',
          app_metadata: { role: 'admin' },
          user_metadata: { 
            role: 'admin', 
            is_super_admin: true 
          }
        };
        
        // Store in sessionStorage to persist across page refreshes
        sessionStorage.setItem('specialAdminSession', JSON.stringify(adminUser));
        
        // Set the user in state
        setUser(adminUser as any);
        
        // Create a mock session object
        const mockSession = {
          access_token: 'admin-token',
          refresh_token: 'admin-refresh',
          user: adminUser,
          expires_at: Date.now() + 3600,
          expires_in: 3600
        };
        
        setSession(mockSession as any);
        
        return { success: true, data: { user: adminUser, session: mockSession } };
      }
      
      // Standard Supabase auth
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
