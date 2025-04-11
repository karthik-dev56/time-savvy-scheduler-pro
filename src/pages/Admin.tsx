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
import { Shield, User, History, Clock, ArrowUp, ArrowDown, LineChart, Search, UserCheck, RefreshCw } from 'lucide-react';

interface UserWithRole {
  id: string;
  email: string;
  role: UserRole | null;
}

interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  details: any;
  created_at: string;
}

const defaultPredictionMetrics: {
  noShowAccuracy: number;
  durationAccuracy: number;
  rescheduleAcceptance: number;
} = {
  noShowAccuracy: 0,
  durationAccuracy: 0,
  rescheduleAcceptance: 0
};

const AdminPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { 
    userRole, 
    loading: roleLoading, 
    assignRole, 
    allUserRoles, 
    searchUsersByEmail, 
    getAuditLogsByEmail,
    getUserByEmail,
    usedDemoData
  } = useRoleManagement();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [predictionMetrics, setPredictionMetrics] = useState(defaultPredictionMetrics);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('users');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [refresh, setRefresh] = useState(0);

  const isSpecialAdmin = user?.id === 'admin-special' || (user?.app_metadata && user.app_metadata.role === 'admin');

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

  useEffect(() => {
    if (!user || (!isSpecialAdmin && userRole !== 'admin' && userRole !== 'manager')) return;
    
    console.log("Setting up real-time subscription for user roles");
    
    const channel = supabase
      .channel('admin-user-roles-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_roles' }, 
        (payload) => {
          console.log('Real-time update received for user_roles:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            updateUserFromRealtimeEvent(payload.new);
          } else if (payload.eventType === 'DELETE') {
            updateUserRolesFromRealtime();
          }
        }
      )
      .subscribe((status) => {
        console.log('User roles subscription status:', status);
      });
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userRole, isSpecialAdmin]);
  
  const updateUserFromRealtimeEvent = (userData: any) => {
    if (!userData || !userData.user_id || !userData.role) return;
    
    setUsers(prevUsers => {
      const userIndex = prevUsers.findIndex(u => u.id === userData.user_id);
      
      if (userIndex >= 0) {
        const updatedUsers = [...prevUsers];
        updatedUsers[userIndex] = {
          ...updatedUsers[userIndex],
          role: userData.role
        };
        return updatedUsers;
      } else {
        return [
          ...prevUsers,
          {
            id: userData.user_id,
            email: `user-${userData.user_id.substring(0, 8)}@example.com`,
            role: userData.role
          }
        ];
      }
    });
  };
  
  const updateUserRolesFromRealtime = useCallback(async () => {
    try {
      console.log("Updating user roles from realtime event");
      
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
        
      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        return;
      }
      
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

  useEffect(() => {
    if (!user || (!isSpecialAdmin && userRole !== 'admin')) return;
    if (activeTab !== 'audit') return;
    
    console.log("Setting up real-time subscription for audit logs");
    
    const channel = supabase
      .channel('admin-audit-logs-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'audit_logs' }, 
        (payload) => {
          console.log('Real-time update received for audit_logs:', payload);
          
          if (selectedUser && payload.new && payload.new.user_id === selectedUser.id) {
            setAuditLogs(prevLogs => [payload.new as any, ...prevLogs.slice(0, 49)]);
          } else if (searchQuery && payload.new) {
            const foundUser = getUserByEmail(searchQuery);
            if (foundUser && foundUser.id === payload.new.user_id) {
              setAuditLogs(prevLogs => [payload.new as any, ...prevLogs.slice(0, 49)]);
            }
          } else if (!selectedUser && !searchQuery) {
            setAuditLogs(prevLogs => [payload.new as any, ...prevLogs.slice(0, 49)]);
          }
        }
      )
      .subscribe((status) => {
        console.log('Audit logs subscription status:', status);
      });
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userRole, isSpecialAdmin, activeTab, selectedUser, searchQuery, getUserByEmail]);

  useEffect(() => {
    if (!user) return;
    if (activeTab !== 'predictions') return;
    
    console.log("Setting up real-time subscription for AI predictions");
    
    const channel = supabase
      .channel('admin-ai-predictions-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ai_predictions' }, 
        (payload) => {
          console.log('Real-time update received for ai_predictions:', payload);
          
          if (payload.eventType === 'INSERT') {
            setPredictions(prev => [payload.new as any, ...prev.slice(0, 9)]);
          }
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ai_prediction_metrics' }, 
        (payload) => {
          console.log('Real-time update received for ai_prediction_metrics:', payload);
          
          if (payload.new) {
            setPredictionMetrics({
              noShowAccuracy: payload.new.no_show_accuracy || 87,
              durationAccuracy: payload.new.duration_accuracy || 92,
              rescheduleAcceptance: payload.new.reschedule_acceptance || 79
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('AI predictions subscription status:', status);
      });
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeTab]);

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
  }, [userRole, activeTab, isSpecialAdmin, user, refresh]);

  const fetchUsers = useCallback(async () => {
    if (!isSpecialAdmin && userRole !== 'admin' && userRole !== 'manager') return;
    
    try {
      console.log("Fetching users with proper email data...");
      
      const filteredUsers = searchUsersByEmail(searchQuery);
      console.log("Fetched users with roles:", filteredUsers);
      setUsers(filteredUsers);
      
      if (searchQuery && filteredUsers.length === 1) {
        setSelectedUser(filteredUsers[0]);
      }
    } catch (error) {
      console.error('Error in fetchUsers:', error);
    }
  }, [isSpecialAdmin, userRole, searchUsersByEmail, searchQuery]);

  const fetchAuditLogs = useCallback(async () => {
    if (!isSpecialAdmin && userRole !== 'admin') return;

    try {
      console.log("Fetching audit logs...");
      
      if (searchQuery) {
        console.log(`Fetching audit logs for search: ${searchQuery}`);
        const logs = await getAuditLogsByEmail(searchQuery);
        setAuditLogs(logs || []);
        return;
      }
      
      if (selectedUser) {
        console.log(`Fetching audit logs for selected user: ${selectedUser.email}`);
        const logs = await getAuditLogsByEmail(selectedUser.email);
        setAuditLogs(logs || []);
        return;
      }
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) {
        console.error('Error fetching audit logs:', error);
        return;
      }
      
      console.log("Fetched audit logs:", data);
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error in fetchAuditLogs:', error);
    }
  }, [isSpecialAdmin, userRole, searchQuery, selectedUser, getAuditLogsByEmail]);

  const fetchAIPredictions = useCallback(async () => {
    try {
      console.log("Fetching AI predictions...");
      
      const metricsData = await getAIPredictionMetrics();
      
      if (metricsData) {
        setPredictionMetrics({
          noShowAccuracy: metricsData.no_show_accuracy || 87,
          durationAccuracy: metricsData.duration_accuracy || 92,
          rescheduleAcceptance: metricsData.reschedule_acceptance || 79
        });
      }
      
      const predictionsData = await getAIPredictions(10);
      setPredictions(predictionsData);
      
    } catch (error) {
      console.error('Error in fetchAIPredictions:', error);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (searchQuery && activeTab === 'audit') {
      fetchAuditLogs();
    } else if (activeTab === 'predictions') {
      fetchAIPredictions();
    }
  }, [searchQuery, activeTab, fetchUsers, fetchAuditLogs, fetchAIPredictions]);

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
      
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? { ...u, role: newRole } : u
        )
      );
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedUser(null);
  };

  const handleRefresh = () => {
    setRefresh(prev => prev + 1);
    toast({
      title: "Refreshing",
      description: "Updating data from the server...",
    });
  };

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

  const getUserEmailById = (userId: string | null): string => {
    if (!userId) return 'System';
    const foundUser = users.find(u => u.id === userId);
    return foundUser ? foundUser.email : `User ${userId.substring(0, 8)}`;
  };

  const filteredUsers = users;

  if (authLoading || roleLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  const isAdmin = isSpecialAdmin || userRole === 'admin';

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    console.log("Search query updated:", value);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchQuery('');
    setSelectedUser(null);
  };

  return (
    <Layout>
      <div className="container max-w-7xl py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          
          <div className="flex space-x-2">
            {usedDemoData && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                Using Demo Data
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={handleTabChange}>
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
                <div className="mt-4 relative">
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users by email..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-8"
                      />
                    </div>
                    {searchQuery && (
                      <Button variant="outline" size="sm" onClick={handleClearSearch}>
                        Clear
                      </Button>
                    )}
                  </div>
                  
                  {selectedUser && (
                    <div className="mt-2 flex items-center">
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
                        <UserCheck className="h-3 w-3" />
                        {selectedUser.email}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)} className="h-6 ml-1 p-1">
                        ×
                      </Button>
                    </div>
                  )}
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
                        <TableRow key={user.id} onClick={() => setSelectedUser(user)} className="cursor-pointer">
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
                            <TableCell onClick={(e) => e.stopPropagation()}>
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
                  <div className="mt-4 relative">
                    <div className="flex gap-2">
                      <div className="relative flex-grow">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Filter by user email..."
                          value={searchQuery}
                          onChange={handleSearchChange}
                          className="pl-8"
                        />
                      </div>
                      {searchQuery && (
                        <Button variant="outline" size="sm" onClick={handleClearSearch}>
                          Clear
                        </Button>
                      )}
                    </div>
                    
                    {selectedUser && (
                      <div className="mt-2 flex items-center">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          {selectedUser.email}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)} className="h-6 ml-1 p-1">
                          ×
                        </Button>
                      </div>
                    )}
                  </div>
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
                            <TableCell>{getUserEmailById(log.user_id)}</TableCell>
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
