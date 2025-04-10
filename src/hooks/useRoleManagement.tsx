
import { useState, useEffect } from 'react';
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

export function useRoleManagement() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [allUserRoles, setAllUserRoles] = useState<UserRoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch the current user's role
  const fetchUserRole = async () => {
    if (!user) {
      setUserRole(null);
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
        console.error('Error fetching user role:', error);
        setUserRole(null);
      } else {
        setUserRole(data.role as UserRole);
      }
    } catch (error: any) {
      console.error('Unexpected error fetching user role:', error);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users with their roles (for admin panel)
  const fetchAllUserRoles = async () => {
    if (!user || userRole !== 'admin') {
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
    if (!user || userRole !== 'admin') {
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

      // Refresh all user roles
      fetchAllUserRoles();
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
    return userRole === role;
  };

  // Check if the current user is an admin or manager
  const isAdminOrManager = (): boolean => {
    return userRole === 'admin' || userRole === 'manager';
  };

  useEffect(() => {
    fetchUserRole();
  }, [user]);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchAllUserRoles();
    }
  }, [userRole]);

  return {
    userRole,
    loading,
    allUserRoles,
    hasRole,
    isAdminOrManager,
    assignRole,
    fetchAllUserRoles,
  };
}
