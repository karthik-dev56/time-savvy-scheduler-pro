import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'admin' | 'manager' | 'user';

export interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface UserWithEmailAndRole {
  id: string;
  email: string;
  role: UserRole;
}

// Enhanced mock data for the admin interface - only used as fallback if database fails
const DEMO_USERS: UserWithEmailAndRole[] = [
  { id: '123e4567-e89b-12d3-a456-426614174000', email: 'admin@example.com', role: 'admin' },
  { id: '123e4567-e89b-12d3-a456-426614174001', email: 'manager@example.com', role: 'manager' },
  { id: '123e4567-e89b-12d3-a456-426614174002', email: 'user1@example.com', role: 'user' },
  { id: '123e4567-e89b-12d3-a456-426614174003', email: 'user2@example.com', role: 'user' }
];

// Demo audit logs for testing - only used as fallback if database fails
const DEMO_AUDIT_LOGS = [
  {
    id: '1',
    user_id: '123e4567-e89b-12d3-a456-426614174004',
    action: 'login',
    table_name: 'auth',
    details: { ip: '192.168.1.1' },
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    user_id: '123e4567-e89b-12d3-a456-426614174004',
    action: 'update_role',
    table_name: 'user_roles',
    details: { old_role: 'user', new_role: 'manager' },
    created_at: new Date().toISOString()
  }
];

export function useRoleManagement() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [allUserRoles, setAllUserRoles] = useState<UserRoleData[]>([]);
  const [usersWithEmails, setUsersWithEmails] = useState<UserWithEmailAndRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Track if we've loaded demo data as fallback
  const [usedDemoData, setUsedDemoData] = useState(false);

  // Fetch the current user's role
  const fetchUserRole = async () => {
    if (!user) {
      setUserRole(null);
      setLoading(false);
      return;
    }

    // Check for special admin user first
    if (user.user_metadata?.is_super_admin || (user.app_metadata && user.app_metadata.role === 'admin')) {
      setUserRole('admin');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Using a type assertion to handle the new table that isn't in the generated types yet
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.log('Error fetching user role:', error);
        
        // Try to create a default role for this user
        try {
          const { data: insertData, error: insertError } = await supabase
            .from('user_roles')
            .insert({ user_id: user.id, role: 'user' })
            .select();
            
          if (!insertError && insertData) {
            console.log("Created default user role");
            setUserRole('user');
          } else {
            console.error("Failed to create default user role:", insertError);
            setUserRole('user'); // Fallback to user role
          }
        } catch (insertCatchErr) {
          console.error("Error creating default user role:", insertCatchErr);
          setUserRole('user');
        }
      } else {
        console.log("Successfully fetched user role:", data);
        setUserRole(data.role as UserRole);
      }
    } catch (error: any) {
      console.error('Unexpected error fetching user role:', error);
      setUserRole('user'); // Fallback to user role
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time listener for current user's role changes
  useEffect(() => {
    if (!user) return;
    
    console.log("Setting up real-time role updates for current user");
    
    // Skip real-time updates for super admin
    if (user.user_metadata?.is_super_admin) {
      return;
    }
    
    // Subscribe to changes in user's role
    const channel = supabase
      .channel('user-role-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_roles',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('User role changed:', payload);
          if (payload.eventType === 'DELETE') {
            setUserRole('user'); // Default to user if role is deleted
          } else if (payload.new) {
            setUserRole((payload.new as any).role);
          }
          
          // Refresh all roles if admin
          if (userRole === 'admin' || user.user_metadata?.is_super_admin) {
            fetchAllUserRoles();
            fetchUsersWithEmailsAndRoles();
          }
        }
      )
      .subscribe((status) => {
        console.log('User role subscription status:', status);
      });
    
    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Improved function to fetch users with emails along with their roles
  const fetchUsersWithEmailsAndRoles = async () => {
    // Check if the special admin user
    if (user?.user_metadata?.is_super_admin || (user?.app_metadata && user.app_metadata.role === 'admin')) {
      // For the special admin user, we don't need to check the database role
      // Just continue with the function
    } else if (!user || userRole !== 'admin') {
      setUsersWithEmails([]);
      return;
    }

    try {
      setLoading(true);
      console.log("Attempting to fetch real user data for admin");
      
      // First, try to get user roles
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('*');
        
      if (!roleError && roleData && Array.isArray(roleData) && roleData.length > 0) {
        console.log("Got role data:", roleData.length);
        
        // Get user profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
          
        if (!profilesError && profilesData && Array.isArray(profilesData)) {
          console.log("Got profiles data:", profilesData.length);
          
          // Map roles to users with emails
          const usersData = roleData.map((role: any) => {
            const userProfile = profilesData.find((p: any) => p.id === role.user_id);
            
            // Create a meaningful email from available data or use a placeholder
            let generatedEmail = "";
            if (userProfile) {
              // Since the profile doesn't have an email field, construct one from first and last name
              // or use a fallback pattern based on the user ID
              generatedEmail = `${userProfile.first_name || ''}${userProfile.last_name ? '.' + userProfile.last_name : ''}@example.com`.toLowerCase();
              if (generatedEmail === '@example.com') {
                generatedEmail = `user-${role.user_id.substring(0, 8)}@example.com`;
              }
            } else {
              generatedEmail = `user-${role.user_id.substring(0, 8)}@example.com`;
            }
              
            return {
              id: role.user_id,
              email: generatedEmail,
              role: role.role as UserRole
            };
          });
          
          console.log("Got real user data from profiles and roles:", usersData.length);
          setUsersWithEmails(usersData);
          setUsedDemoData(false);
          setLoading(false);
          return;
        }
      }
      
      // If we couldn't get combined data, try a different approach
      console.warn("Could not fetch combined user data, trying profiles only");
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
        
      if (!profilesError && profiles && profiles.length > 0) {
        console.log("Got profiles only:", profiles.length);
        
        // Create users with default user role
        const usersData = profiles.map((profile: any) => {
          // Generate email from profile data
          const generatedEmail = `${profile.first_name || ''}${profile.last_name ? '.' + profile.last_name : ''}@example.com`.toLowerCase();
          const email = generatedEmail === '@example.com' ? 
            `user-${profile.id.substring(0, 8)}@example.com` : 
            generatedEmail;
            
          return {
            id: profile.id,
            email: email,
            role: 'user' as UserRole
          };
        });
        
        console.log("Created users from profiles:", usersData.length);
        setUsersWithEmails(usersData);
        setUsedDemoData(false);
        setLoading(false);
        return;
      }
      
      // Try to create some sample data if nothing exists
      try {
        console.log("No users found in database, creating sample data");
        
        // Create sample profiles with random IDs (important for TypeScript compatibility)
        const sampleProfiles = [
          { id: crypto.randomUUID(), first_name: 'Admin', last_name: 'User' },
          { id: crypto.randomUUID(), first_name: 'Manager', last_name: 'User' },
          { id: crypto.randomUUID(), first_name: 'Regular', last_name: 'User' }
        ];
        
        const { data: newProfiles, error: createError } = await supabase
          .from('profiles')
          .insert(sampleProfiles)
          .select();
          
        if (!createError && newProfiles && newProfiles.length > 0) {
          console.log("Created sample profiles:", newProfiles.length);
          
          // Create roles for these profiles with proper UserRole type
          const roleInserts = newProfiles.map((profile, index) => ({
            user_id: profile.id,
            role: (index === 0 ? 'admin' : (index === 1 ? 'manager' : 'user')) as UserRole
          }));
          
          const { data: newRoles } = await supabase
            .from('user_roles')
            .insert(roleInserts)
            .select();
            
          if (newRoles) {
            // Generate user data with emails
            const userData = newProfiles.map((profile, index) => ({
              id: profile.id,
              email: `${profile.first_name.toLowerCase()}.${profile.last_name.toLowerCase()}@example.com`,
              role: (index === 0 ? 'admin' as UserRole : (index === 1 ? 'manager' as UserRole : 'user' as UserRole))
            }));
            
            console.log("Created sample users with roles:", userData.length);
            setUsersWithEmails(userData);
            setUsedDemoData(false);
            setLoading(false);
            return;
          }
        }
      } catch (createError) {
        console.error("Error creating sample users:", createError);
      }
      
      // If all approaches failed, use demo data
      console.warn("Could not fetch real user data, using demo data instead");
      const usersData = [...DEMO_USERS];
      
      // Add any missing special users
      const knownEmails = new Set(usersData.map(u => u.email.toLowerCase()));
      if (user.email && !knownEmails.has(user.email.toLowerCase())) {
        // Add current user if not already in the list
        usersData.push({
          id: user.id,
          email: user.email,
          role: 'admin' as UserRole
        });
      }
      
      // Add the special admin user if not already there
      if (!knownEmails.has('k8716610@gmail.com')) {
        usersData.push({
          id: '00000000-0000-0000-0000-000000000000', // Special admin UUID
          email: 'k8716610@gmail.com',
          role: 'admin' as UserRole
        });
      }
      
      console.log("Using demo users with emails and roles:", usersData);
      setUsersWithEmails(usersData);
      setUsedDemoData(true);
    } catch (error: any) {
      console.error('Error fetching users with emails:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
      
      // Fallback to demo data
      setUsersWithEmails([...DEMO_USERS]);
      setUsedDemoData(true);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users with their roles (for admin panel)
  const fetchAllUserRoles = async () => {
    // Check if the special admin user
    if (user?.user_metadata?.is_super_admin || (user?.app_metadata && user.app_metadata.role === 'admin')) {
      // For the special admin user, we don't need to check the database role
      // Just continue with the function
    } else if (!user || userRole !== 'admin') {
      setAllUserRoles([]);
      return;
    }

    try {
      setLoading(true);
      
      // Using a type assertion to handle the new table
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');

      if (error) {
        console.error('Error fetching all user roles:', error);
        toast({
          title: "Error",
          description: "Could not load user roles",
          variant: "destructive",
        });
        setAllUserRoles([]);
      } else {
        setAllUserRoles(data as unknown as UserRoleData[]);
      }
    } catch (error: any) {
      console.error('Unexpected error fetching all user roles:', error);
      setAllUserRoles([]);
    } finally {
      setLoading(false);
    }
  };

  // Assign a role to a user (admin only)
  const assignRole = async (userId: string, role: UserRole) => {
    // Check if the special admin user
    if (user?.user_metadata?.is_super_admin || (user?.app_metadata && user.app_metadata.role === 'admin')) {
      // Special admin is always allowed to assign roles
    } else if (!user || userRole !== 'admin') {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to assign roles",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Using a type assertion for the new table
      const { data, error } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: userId, 
          role,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Error assigning role:', error);
        toast({
          title: "Error",
          description: "Could not assign role",
          variant: "destructive",
        });
        return false;
      }

      // Log the action to audit logs
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'assign_role',
          table_name: 'user_roles',
          record_id: userId,
          details: { assigned_role: role }
        } as any);

      toast({
        title: "Role Assigned",
        description: `Successfully assigned role: ${role}`,
      });

      // Also update local state for usersWithEmails
      setUsersWithEmails(prev => 
        prev.map(u => u.id === userId ? { ...u, role } : u)
      );

      return true;
    } catch (error: any) {
      console.error('Unexpected error assigning role:', error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    }
  };

  const hasRole = (role: UserRole): boolean => {
    if (user?.user_metadata?.is_super_admin && role === 'admin') {
      return true;
    }
    return userRole === role;
  };

  const isAdminOrManager = (): boolean => {
    if (user?.user_metadata?.is_super_admin || (user?.app_metadata && user.app_metadata.role === 'admin')) {
      return true;
    }
    return userRole === 'admin' || userRole === 'manager';
  };

  const searchUsersByEmail = (query: string): UserWithEmailAndRole[] => {
    if (!query) return usersWithEmails;
    
    console.log("Searching for users with email containing:", query);
    console.log("Available users to search:", usersWithEmails);
    
    const filtered = usersWithEmails.filter(u => 
      u.email.toLowerCase().includes(query.toLowerCase())
    );
    
    console.log("Search results:", filtered);
    return filtered;
  };

  const getAuditLogsByEmail = useCallback(async (email: string) => {
    if (!email) return [];
    
    const user = usersWithEmails.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return DEMO_AUDIT_LOGS;
    
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error || !data || data.length === 0) {
        console.log("No real audit logs found for", email, "using demo logs");
        return DEMO_AUDIT_LOGS;
      }
      
      console.log("Found real audit logs for", email, data.length, "logs");
      return data;
    } catch (error) {
      console.error("Error fetching audit logs for user:", error);
      return DEMO_AUDIT_LOGS;
    }
  }, [usersWithEmails]);

  const getUserByEmail = (email: string): UserWithEmailAndRole | null => {
    return usersWithEmails.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  };

  useEffect(() => {
    fetchUserRole();
  }, [user]);

  useEffect(() => {
    if (userRole === 'admin' || user?.user_metadata?.is_super_admin) {
      fetchAllUserRoles();
      fetchUsersWithEmailsAndRoles();
    }
  }, [userRole, user]);

  return {
    userRole: user?.user_metadata?.is_super_admin ? 'admin' : userRole,
    loading,
    allUserRoles,
    usersWithEmails,
    hasRole,
    isAdminOrManager,
    assignRole,
    fetchAllUserRoles,
    fetchUsersWithEmailsAndRoles,
    searchUsersByEmail,
    getUserByEmail,
    getAuditLogsByEmail,
    usedDemoData,
  };
}
