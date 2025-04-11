
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useRoleManagement, UserRole, UserRoleData } from '@/hooks/useRoleManagement';
import { supabase, AIPrediction, AIPredictionMetrics, getAIPredictionMetrics, getAIPredictions } from '@/integrations/supabase/client';
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
import { Shield, User, History, Clock, ArrowUp, ArrowDown, LineChart } from 'lucide-react';

interface UserWithRole {
  id: string;
  email: string;
  role: UserRole | null;
}

const AdminPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { userRole, loading: roleLoading, assignRole, allUserRoles } = useRoleManagement();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [predictionMetrics, setPredictionMetrics] = useState({
    noShowAccuracy: 0,
    durationAccuracy: 0,
    rescheduleAcceptance: 0
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('users');

  const isSpecialAdmin = user?.id === 'admin-special' || (user?.app_metadata && user.app_metadata.role === 'admin');

  // Redirect if not authenticated - optimized to prevent unnecessary redirects
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { returnPath: '/admin' } });
      return;
    }
    
    if (!authLoading && !roleLoading && user) {
      if (!isSpecialAdmin && userRole !== 'admin' && userRole !== 'manager') {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this page",
          variant: "destructive",
        });
        navigate('/');
      }
    }
  }, [user, userRole, authLoading, roleLoading, isSpecialAdmin, navigate, toast]);

  // Set up real-time subscription for user roles
  useEffect(() => {
    if (!user || (!isSpecialAdmin && userRole !== 'admin' && userRole !== 'manager')) return;
    
    console.log("Setting up real-time subscription for user roles");
    
    // Subscribe to changes in the user_roles table
    const channel = supabase
      .channel('admin-user-roles-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_roles' }, 
        (payload) => {
          console.log('Real-time update received for user_roles:', payload);
          updateUserRolesFromRealtime();
        }
      )
      .subscribe();
      
    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userRole, isSpecialAdmin]);
  
  // Function to update users when real-time changes occur
  const updateUserRolesFromRealtime = useCallback(async () => {
    try {
      console.log("Updating user roles from realtime event");
      
      // Get all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
        
      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        return;
      }
      
      // Create a simplified user list from roles
      const usersWithRoles: UserWithRole[] = userRoles?.map((ur: any) => ({
        id: ur.user_id,
        email: `User ${ur.user_id.substring(0, 8)}`,
        role: ur.role as UserRole
      })) || [];
      
      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error in updateUserRolesFromRealtime:', error);
    }
  }, []);

  // Set up real-time subscription for audit logs
  useEffect(() => {
    if (!user || (!isSpecialAdmin && userRole !== 'admin')) return;
    if (activeTab !== 'audit') return;
    
    console.log("Setting up real-time subscription for audit logs");
    
    // Subscribe to changes in the audit_logs table
    const channel = supabase
      .channel('admin-audit-logs-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'audit_logs' }, 
        (payload) => {
          console.log('Real-time update received for audit_logs:', payload);
          setAuditLogs(prevLogs => [payload.new as any, ...prevLogs.slice(0, 49)]);
        }
      )
      .subscribe();
      
    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userRole, isSpecialAdmin, activeTab]);

  // Initial data loading based on active tab - optimized to prevent multiple calls
  useEffect(() => {
    if (!user) return; // Don't fetch if no user
    
    if (isSpecialAdmin || userRole === 'admin' || userRole === 'manager') {
      const fetchData = async () => {
        console.log(`Loading data for tab: ${activeTab}`);
        setLoading(true);
        
        try {
          if (activeTab === 'users') {
            await fetchUsers();
          } else if (activeTab === 'audit' && (isSpecialAdmin || userRole === 'admin')) {
            await fetchAuditLogs();
          } else if (activeTab === 'predictions') {
            await fetchAIPredictions();
          }
        } catch (error) {
          console.error(`Error fetching data for ${activeTab} tab:`, error);
          toast({
            title: "Error",
            description: `Failed to load ${activeTab} data`,
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [userRole, activeTab, isSpecialAdmin, user]);

  // Memoized fetch functions to prevent unnecessary re-renders
  const fetchUsers = useCallback(async () => {
    if (!isSpecialAdmin && userRole !== 'admin' && userRole !== 'manager') return;
    
    try {
      console.log("Fetching users...");
      
      // Get all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
        
      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        return;
      }
      
      // Create a simplified user list from roles
      const usersWithRoles: UserWithRole[] = userRoles?.map((ur: any) => ({
        id: ur.user_id,
        email: `User ${ur.user_id.substring(0, 8)}`,
        role: ur.role as UserRole
      })) || [];
      
      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
    }
  }, [isSpecialAdmin, userRole]);

  const fetchAuditLogs = useCallback(async () => {
    if (!isSpecialAdmin && userRole !== 'admin') return;

    try {
      console.log("Fetching audit logs...");
      
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
    }
  }, [isSpecialAdmin, userRole]);

  const fetchAIPredictions = useCallback(async () => {
    try {
      console.log("Fetching AI predictions...");
      
      // Use our helper function to fetch metrics
      const metricsData = await getAIPredictionMetrics();
      
      if (metricsData) {
        setPredictionMetrics({
          noShowAccuracy: metricsData.no_show_accuracy || 87,
          durationAccuracy: metricsData.duration_accuracy || 92,
          rescheduleAcceptance: metricsData.reschedule_acceptance || 79
        });
      }
      
      // Use our helper function to fetch predictions
      const predictionsData = await getAIPredictions(10);
      setPredictions(predictionsData);
      
    } catch (error) {
      console.error('Error in fetchAIPredictions:', error);
    }
  }, []);

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!isSpecialAdmin && userRole !== 'admin') {
      toast({
        title: "Permission Denied",
        description: "Only admins can change user roles",
        variant: "destructive",
      });
      return;
    }
    
    const success = await assignRole(userId, newRole);
    if (success) {
      toast({
        title: "Role Updated",
        description: `User role changed to ${newRole}`,
      });
      
      // The real-time subscription will update the users list
      // This fallback updates the local state if real-time fails
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? { ...u, role: newRole } : u
        )
      );
    }
  };

  // Format prediction accuracy display
  const formatAccuracy = (prediction: AIPrediction) => {
    if (prediction.type === 'Duration') {
      const diff = prediction.accuracy < 100 ? 
        `Underestimated by ${100 - prediction.accuracy}%` : 
        `Overestimated by ${prediction.accuracy - 100}%`;
      return diff;
    } else if (prediction.type === 'Reschedule') {
      return `Accepted slot #${prediction.accuracy}`;
    } else {
      return prediction.accuracy >= 80 ? 'Correct' : 'Incorrect';
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

  // Determine what tabs to show based on role
  const isAdmin = isSpecialAdmin || userRole === 'admin';

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
            {isAdmin && (
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
                  {isAdmin 
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
                      {isAdmin && <TableHead>Actions</TableHead>}
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
                          {isAdmin && (
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
          
          {isAdmin && (
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
                                {log.details && JSON.stringify(log.details).length > 50 && '...'}
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
                        <div className="flex items-baseline">
                          <p className="text-2xl font-bold">{predictionMetrics.noShowAccuracy}%</p>
                          <Badge variant="outline" className="ml-2 bg-green-50 text-green-800 border-green-200">
                            <ArrowUp className="h-3 w-3 mr-1" />
                            2% 
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">Accuracy rate</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg">Meeting Duration</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex items-baseline">
                          <p className="text-2xl font-bold">{predictionMetrics.durationAccuracy}%</p>
                          <Badge variant="outline" className="ml-2 bg-green-50 text-green-800 border-green-200">
                            <ArrowUp className="h-3 w-3 mr-1" />
                            3%
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">Prediction accuracy</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg">Auto-Rescheduling</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex items-baseline">
                          <p className="text-2xl font-bold">{predictionMetrics.rescheduleAcceptance}%</p>
                          <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-800 border-amber-200">
                            <ArrowDown className="h-3 w-3 mr-1" />
                            1%
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">Acceptance rate</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">Recent AI Activity</h3>
                      <Button variant="outline" size="sm" className="gap-2">
                        <LineChart className="h-4 w-4" />
                        View Full Report
                      </Button>
                    </div>
                    
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
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center">Loading predictions...</TableCell>
                          </TableRow>
                        ) : predictions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center">No prediction data found</TableCell>
                          </TableRow>
                        ) : (
                          predictions.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell>{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'Unknown'}</TableCell>
                              <TableCell>{entry.type}</TableCell>
                              <TableCell>{entry.prediction}</TableCell>
                              <TableCell>{formatAccuracy(entry)}</TableCell>
                            </TableRow>
                          ))
                        )}
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
