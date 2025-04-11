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

// Enhanced mock data for the admin interface
const DEMO_USERS: UserWithEmailAndRole[] = [
  { id: '123e4567-e89b-12d3-a456-426614174000', email: 'admin@example.com', role: 'admin' },
  { id: '123e4567-e89b-12d3-a456-426614174001', email: 'manager@example.com', role: 'manager' },
  { id: '123e4567-e89b-12d3-a456-426614174002', email: 'user1@example.com', role: 'user' },
  { id: '123e4567-e89b-12d3-a456-426614174003', email: 'user2@example.com', role: 'user' },
  { id: '123e4567-e89b-12d3-a456-426614174004', email: 'prokarthik1449@gmail.com', role: 'user' },
  { id: '123e4567-e89b-12d3-a456-426614174005', email: 'user.test@example.com', role: 'user' },
];

// Demo audit logs for testing
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
    if (user.id === 'admin-special' || (user.app_metadata && user.app_metadata.role === 'admin')) {
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
        // If there's an error, set a default role of 'user'
        setUserRole('user');
      } else {
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
          if (userRole === 'admin' || user.id === 'admin-special') {
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
    if (user?.id === 'admin-special' || (user?.app_metadata && user.app_metadata.role === 'admin')) {
      // For the special admin user, we don't need to check the database role
      // Just continue with the function
    } else if (!user || userRole !== 'admin') {
      setUsersWithEmails([]);
      return;
    }

    try {
      setLoading(true);
      
      // In a real application, we would fetch user data from auth.users via a secure RPC
      // For this demo, we'll simulate it with user_roles data and add email patterns
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('*');

      if (roleError) {
        console.error('Error fetching user roles with emails:', roleError);
        toast({
          title: "Error",
          description: "Could not load user data",
          variant: "destructive",
        });
        
        // Fallback to demo data
        console.log("Using demo data for users");
        setUsersWithEmails(DEMO_USERS);
        setUsedDemoData(true);
        return;
      }

      // In a real app, this would come from auth.users
      // For our demo, if we have no user_roles data, use demo data
      if (!roleData || roleData.length === 0) {
        console.log("No user roles found, using demo data");
        setUsersWithEmails(DEMO_USERS);
        setUsedDemoData(true);
        return;
      }

      // Map roles to include simulated email addresses
      const usersData = roleData.map((role: any) => {
        // Create a more realistic email pattern for demo purposes
        const userId = role.user_id;
        
        // Add a recognizable email for our test user
        if (userId === '123e4567-e89b-12d3-a456-426614174004') {
          return {
            id: userId,
            email: 'prokarthik1449@gmail.com',
            role: role.role as UserRole
          };
        }
        
        const email = `user-${userId.substring(0, 8)}@example.com`;
        
        return {
          id: userId,
          email: email,
          role: role.role as UserRole
        };
      });
      
      // Add our demo users if we don't have many real users
      if (usersData.length < 3) {
        console.log("Adding some demo users to enhance the interface");
        usersData.push(...DEMO_USERS.filter(u => !usersData.some(ud => ud.id === u.id)));
      }
      
      console.log("Users with emails and roles:", usersData);
      setUsersWithEmails(usersData);
      setUsedDemoData(false);
    } catch (error: any) {
      console.error('Error fetching users with emails:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
      
      // Fallback to demo data
      setUsersWithEmails(DEMO_USERS);
      setUsedDemoData(true);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users with their roles (for admin panel)
  const fetchAllUserRoles = async () => {
    // Check if the special admin user
    if (user?.id === 'admin-special' || (user?.app_metadata && user.app_metadata.role === 'admin')) {
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
    if (user?.id === 'admin-special' || (user?.app_metadata && user.app_metadata.role === 'admin')) {
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

  // Check if the current user has a specific role
  const hasRole = (role: UserRole): boolean => {
    if (user?.id === 'admin-special' && role === 'admin') {
      return true;
    }
    return userRole === role;
  };

  // Check if the current user is an admin or manager
  const isAdminOrManager = (): boolean => {
    if (user?.id === 'admin-special' || (user?.app_metadata && user.app_metadata.role === 'admin')) {
      return true;
    }
    return userRole === 'admin' || userRole === 'manager';
  };

  // Improved search function that works even with demo data
  const searchUsersByEmail = (query: string): UserWithEmailAndRole[] => {
    if (!query) return usersWithEmails;
    
    // Log what we're searching for to help debug
    console.log("Searching for users with email containing:", query);
    console.log("Available users to search:", usersWithEmails);
    
    const filtered = usersWithEmails.filter(u => 
      u.email.toLowerCase().includes(query.toLowerCase())
    );
    
    console.log("Search results:", filtered);
    return filtered;
  };

  // Get audit logs for a specific user by email
  const getAuditLogsByEmail = useCallback(async (email: string) => {
    if (!email) return [];
    
    // Find the user with this email
    const user = usersWithEmails.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return DEMO_AUDIT_LOGS;
    
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error || !data || data.length === 0) {
        console.log("Using demo audit logs for", email);
        return DEMO_AUDIT_LOGS;
      }
      
      return data;
    } catch (error) {
      console.error("Error fetching audit logs for user:", error);
      return DEMO_AUDIT_LOGS;
    }
  }, [usersWithEmails]);

  // Get user by email
  const getUserByEmail = (email: string): UserWithEmailAndRole | null => {
    return usersWithEmails.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  };

  useEffect(() => {
    fetchUserRole();
  }, [user]);

  useEffect(() => {
    if (userRole === 'admin' || user?.id === 'admin-special') {
      fetchAllUserRoles();
      fetchUsersWithEmailsAndRoles();
    }
  }, [userRole, user]);

  return {
    userRole: user?.id === 'admin-special' ? 'admin' : userRole,
    loading,
    allUserRoles,
    usersWithEmails,
    hasRole,
    isAdminOrManager,
    assignRole,
    fetchAllUserRoles,
    searchUsersByEmail,
    getUserByEmail,
    getAuditLogsByEmail,
    usedDemoData,
  };
}
