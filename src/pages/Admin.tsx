
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useRoleManagement, UserRole, UserRoleData } from '@/hooks/useRoleManagement';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, User, History, Clock } from 'lucide-react';

interface UserWithRole {
  id: string;
  email: string;
  role: UserRole | null;
}

const AdminPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { userRole, loading: roleLoading, assignRole } = useRoleManagement();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('users');

  // Redirect if not admin or manager
  useEffect(() => {
    if (!authLoading && !roleLoading && user) {
      if (userRole !== 'admin' && userRole !== 'manager') {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this page",
          variant: "destructive",
        });
        navigate('/');
      }
    } else if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, userRole, authLoading, roleLoading]);

  // Fetch users and their roles
  const fetchUsers = async () => {
    if (userRole !== 'admin' && userRole !== 'manager') return;

    try {
      setLoading(true);
      
      // Get all users from auth
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error fetching users:', authError);
        return;
      }
      
      // Get all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
        
      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        return;
      }
      
      // Map roles to users
      const usersWithRoles: UserWithRole[] = authUsers?.users?.map(authUser => {
        const userRoleData = userRoles?.find(ur => ur.user_id === authUser.id);
        return {
          id: authUser.id,
          email: authUser.email || 'No email',
          role: userRoleData?.role as UserRole || null
        };
      }) || [];
      
      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    if (userRole !== 'admin') return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) {
        console.error('Error fetching audit logs:', error);
        return;
      }
      
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error in fetchAuditLogs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data based on active tab
  useEffect(() => {
    if (userRole === 'admin' || userRole === 'manager') {
      if (activeTab === 'users') {
        fetchUsers();
      } else if (activeTab === 'audit' && userRole === 'admin') {
        fetchAuditLogs();
      }
    }
  }, [userRole, activeTab]);

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (userRole !== 'admin') {
      toast({
        title: "Permission Denied",
        description: "Only admins can change user roles",
        variant: "destructive",
      });
      return;
    }
    
    const success = await assignRole(userId, newRole);
    if (success) {
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? { ...u, role: newRole } : u
        )
      );
    }
  };

  // Filter users by search query
  const filteredUsers = searchQuery 
    ? users.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    : users;

  if (authLoading || roleLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-7xl py-10">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="users">
              <User className="mr-2 h-4 w-4" />
              Users & Roles
            </TabsTrigger>
            {userRole === 'admin' && (
              <TabsTrigger value="audit">
                <History className="mr-2 h-4 w-4" />
                Audit Logs
              </TabsTrigger>
            )}
            <TabsTrigger value="predictions">
              <Clock className="mr-2 h-4 w-4" />
              AI Predictions
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  {userRole === 'admin' 
                    ? 'Manage users and their permission levels' 
                    : 'View users and their permission levels'}
                </CardDescription>
                <div className="mt-4">
                  <Input
                    placeholder="Search users by email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Current Role</TableHead>
                      {userRole === 'admin' && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">Loading users...</TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">No users found</TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              user.role === 'admin' 
                                ? 'bg-red-100 text-red-800 border-red-200' 
                                : user.role === 'manager' 
                                  ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                  : 'bg-gray-100 text-gray-800 border-gray-200'
                            }>
                              <Shield className="mr-1 h-3 w-3" />
                              {user.role || 'No Role'}
                            </Badge>
                          </TableCell>
                          {userRole === 'admin' && (
                            <TableCell>
                              <Select
                                value={user.role || ''}
                                onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                                disabled={user.id === user?.id} // Can't change own role
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Assign role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="manager">Manager</SelectItem>
                                  <SelectItem value="user">User</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          {userRole === 'admin' && (
            <TabsContent value="audit">
              <Card>
                <CardHeader>
                  <CardTitle>Audit Logs</CardTitle>
                  <CardDescription>
                    Track system activity and security events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">Loading logs...</TableCell>
                        </TableRow>
                      ) : auditLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">No audit logs found</TableCell>
                        </TableRow>
                      ) : (
                        auditLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                            <TableCell>{log.user_id?.substring(0, 8) || 'System'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-50 text-blue-800">
                                {log.action}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs">
                                {log.details ? JSON.stringify(log.details).substring(0, 50) : '-'}
                              </code>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          <TabsContent value="predictions">
            <Card>
              <CardHeader>
                <CardTitle>AI Prediction Metrics</CardTitle>
                <CardDescription>
                  View and analyze AI predictions for scheduling efficiency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg">No-Show Predictions</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-2xl font-bold">87%</p>
                        <p className="text-muted-foreground text-sm">Accuracy rate</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg">Meeting Duration</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-2xl font-bold">92%</p>
                        <p className="text-muted-foreground text-sm">Prediction accuracy</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg">Auto-Rescheduling</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-2xl font-bold">79%</p>
                        <p className="text-muted-foreground text-sm">Acceptance rate</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Recent AI Activity</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Prediction</TableHead>
                          <TableHead>Accuracy</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { time: '2025-04-10 09:15 AM', type: 'No-Show', prediction: 'Low Risk (15%)', accuracy: 'Correct' },
                          { time: '2025-04-10 10:30 AM', type: 'Duration', prediction: '45 minutes', accuracy: 'Underestimated by 10 min' },
                          { time: '2025-04-10 01:45 PM', type: 'Reschedule', prediction: 'Suggested 3 slots', accuracy: 'Accepted slot #2' }
                        ].map((entry, i) => (
                          <TableRow key={i}>
                            <TableCell>{entry.time}</TableCell>
                            <TableCell>{entry.type}</TableCell>
                            <TableCell>{entry.prediction}</TableCell>
                            <TableCell>{entry.accuracy}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminPage;
