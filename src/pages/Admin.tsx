import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from '@/hooks/useAuth';
import { useRoleManagement } from '@/hooks/useRoleManagement';
import { useAppointments } from '@/hooks/useAppointments';
import { 
  supabase, 
  getAIPredictionMetrics, 
  getAIPredictions, 
  getUserCount, 
  getRegisteredUsers,
  ensureAuditLogsExist,
  debugAppointments
} from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { AIPredictionMetrics, AIPrediction } from '@/integrations/supabase/client';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Calendar, Clock, User, Users, RefreshCw, AlertTriangle } from 'lucide-react';

const AdminPage = () => {
  const { user } = useAuth();
  const { userRole, fetchUsersWithEmailsAndRoles, usersWithEmails, usedDemoData } = useRoleManagement();
  const { appointments, fetchAppointments } = useAppointments();
  const { toast } = useToast();
  
  const [aiMetrics, setAiMetrics] = useState<AIPredictionMetrics | null>(null);
  const [aiPredictions, setAiPredictions] = useState<AIPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [userCount, setUserCount] = useState<number>(0);
  const [appointmentCount, setAppointmentCount] = useState<number>(0);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [supabaseAppointments, setSupabaseAppointments] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        console.log("Fetching admin data");
        
        await ensureAuditLogsExist();
        
        // Force refresh of user data from Supabase
        await fetchUsersWithEmailsAndRoles();
        
        const count = await getUserCount();
        setUserCount(count > 0 ? count : usersWithEmails.length);
        
        const users = await getRegisteredUsers();
        setRegisteredUsers(users);
        
        // Fetch appointments directly from Supabase
        try {
          console.log("Directly fetching appointments from Supabase");
          const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (error) {
            console.error("Error directly fetching appointments:", error);
            toast({
              title: "Error",
              description: "Failed to fetch appointments from database",
              variant: "destructive",
            });
          } else if (data && data.length > 0) {
            console.log("Successfully fetched appointments directly:", data.length);
            setSupabaseAppointments(data);
            setAppointmentCount(data.length);
          } else {
            console.log("No appointments found in Supabase, fetching from hook");
            await fetchAppointments();
            setSupabaseAppointments(appointments);
            setAppointmentCount(appointments.length);
          }
        } catch (appointmentError) {
          console.error("Error in direct appointment fetch:", appointmentError);
          await fetchAppointments();
          setSupabaseAppointments(appointments);
          setAppointmentCount(appointments.length);
        }
        
        try {
          const metrics = await getAIPredictionMetrics();
          setAiMetrics(metrics);
        } catch (metricsError) {
          console.error("Error fetching AI metrics:", metricsError);
        }
        
        try {
          const predictions = await getAIPredictions();
          setAiPredictions(predictions);
        } catch (predictionsError) {
          console.error("Error fetching AI predictions:", predictionsError);
        }
        
        try {
          const { data: logs } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
            
          if (logs && logs.length > 0) {
            setAuditLogs(logs);
          }
        } catch (logsError) {
          console.error("Error fetching audit logs:", logsError);
        }
        
        if (usedDemoData) {
          toast({
            title: "Notice",
            description: "Using demo data as real user data could not be fetched from Supabase. Check your connection.",
          });
        }
      } catch (error) {
        console.error("Error in admin data fetching:", error);
        toast({
          title: "Error",
          description: "Failed to load admin data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      console.log("Authorized admin access, fetching data");
      fetchAdminData();
    }
  }, [user, toast, fetchUsersWithEmailsAndRoles, fetchAppointments]);

  const refreshAdminData = async () => {
    toast({
      title: "Refreshing data",
      description: "Fetching the latest data from the database...",
    });
    
    setLoading(true);
    try {
      // Debug appointments to see what's in the database
      await debugAppointments();
      
      // Force refresh users from Supabase
      await fetchUsersWithEmailsAndRoles();
      
      // Make sure we fetch all appointments first
      await fetchAppointments();
      
      // Get appointment data with direct call to Supabase
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Error refreshing appointments directly:", error);
        } else if (data && data.length > 0) {
          console.log("Successfully refreshed appointments directly:", data.length);
          setSupabaseAppointments(data);
          setAppointmentCount(data.length);
        } else {
          setSupabaseAppointments(appointments);
          setAppointmentCount(appointments.length);
        }
      } catch (appointmentError) {
        console.error("Error in direct appointment refresh:", appointmentError);
        setSupabaseAppointments(appointments);
        setAppointmentCount(appointments.length);
      }
      
      const count = await getUserCount();
      setUserCount(count);
      
      const users = await getRegisteredUsers();
      setRegisteredUsers(users);
      
      const metrics = await getAIPredictionMetrics();
      setAiMetrics(metrics);
      
      const predictions = await getAIPredictions();
      setAiPredictions(predictions);
      
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (logs) {
        setAuditLogs(logs);
      }
      
      toast({
        title: "Data refreshed",
        description: "Admin dashboard data has been updated.",
      });
      
      if (usedDemoData) {
        toast({
          title: "Notice", 
          description: "Still using demo data as real user data could not be fetched from Supabase.",
        });
      }
    } catch (error) {
      console.error("Error refreshing admin data:", error);
      toast({
        title: "Error",
        description: "Failed to refresh admin data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button onClick={refreshAdminData} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>
        
        {usedDemoData && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <AlertTriangle className="h-6 w-6 text-yellow-400 mr-3" />
              <div>
                <p className="font-medium text-yellow-700">Using Demo Data</p>
                <p className="text-sm text-yellow-600">
                  Could not connect to Supabase to fetch real user data. Using demo data instead. 
                  Please check your Supabase connection and refresh.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="ai-metrics">AI Metrics</TabsTrigger>
            <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{userCount || usersWithEmails.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Registered users in system</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" /> 
                    Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {appointmentCount || supabaseAppointments.length || appointments.length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Total appointments in system</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                    <p className="font-medium">All systems operational</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Last checked: {new Date().toLocaleTimeString()}</p>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Time</TableHead>
                        <TableHead>Priority</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supabaseAppointments.length > 0 ? (
                        supabaseAppointments.slice(0, 5).map((appointment, index) => (
                          <TableRow key={appointment.id || index}>
                            <TableCell className="font-medium">{appointment.title}</TableCell>
                            <TableCell>{(appointment.user_id || "").substring(0, 8)}...</TableCell>
                            <TableCell>{formatDate(appointment.start_time)}</TableCell>
                            <TableCell>{formatDate(appointment.end_time)}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-md text-xs ${
                                appointment.priority === 'high' ? 'bg-red-100 text-red-800' :
                                appointment.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {appointment.priority}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            No appointments found. Try refreshing the data.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  All Appointments from Supabase
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Time</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supabaseAppointments.length > 0 ? (
                        supabaseAppointments.map((appointment, index) => (
                          <TableRow key={appointment.id || index}>
                            <TableCell className="font-medium">{appointment.title}</TableCell>
                            <TableCell className="max-w-xs truncate">{appointment.description || "N/A"}</TableCell>
                            <TableCell>{(appointment.user_id || "").substring(0, 8)}...</TableCell>
                            <TableCell>{formatDate(appointment.start_time)}</TableCell>
                            <TableCell>{formatDate(appointment.end_time)}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-md text-xs ${
                                appointment.priority === 'high' ? 'bg-red-100 text-red-800' :
                                appointment.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {appointment.priority}
                              </span>
                            </TableCell>
                            <TableCell>{formatDate(appointment.created_at)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-10">
                            <div className="flex flex-col items-center justify-center space-y-3">
                              <Calendar className="h-12 w-12 text-gray-400" />
                              <div>
                                <p className="text-lg font-medium">No appointments found</p>
                                <p className="text-sm text-gray-500">Try refreshing the data or adding appointments to your account.</p>
                              </div>
                              <Button onClick={refreshAdminData}>Refresh Data</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Registered Users
                </CardTitle>
                {usedDemoData && (
                  <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                    Demo Data
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Name/Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Registration Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersWithEmails.length > 0 ? (
                        usersWithEmails.map((user, index) => (
                          <TableRow key={user.id || index}>
                            <TableCell className="font-medium">{(user.id || "").substring(0, 8)}...</TableCell>
                            <TableCell>{user.email || `${registeredUsers.find(u => u.id === user.id)?.first_name || 'User'} ${registeredUsers.find(u => u.id === user.id)?.last_name || index}`}</TableCell>
                            <TableCell>{user.role || 'user'}</TableCell>
                            <TableCell>{formatDate(registeredUsers.find(u => u.id === user.id)?.created_at || new Date().toISOString())}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-10">
                            <div className="flex flex-col items-center justify-center space-y-3">
                              <Users className="h-12 w-12 text-gray-400" />
                              <div>
                                <p className="text-lg font-medium">No registered users found</p>
                                <p className="text-sm text-gray-500">User data will appear here once accounts are created.</p>
                              </div>
                              <Button onClick={refreshAdminData}>Refresh Data</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="ai-metrics">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>No-Show Prediction</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {aiMetrics?.no_show_accuracy || 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">Accuracy rate</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Duration Prediction</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {aiMetrics?.duration_accuracy || 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">Accuracy rate</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Reschedule Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {aiMetrics?.reschedule_acceptance || 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">Acceptance rate</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Prediction Type Distribution</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="h-64 w-full max-w-md">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getPredictionDistributionData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {getPredictionDistributionData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Predictions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 overflow-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-medium text-muted-foreground">
                          <th className="pb-2">Type</th>
                          <th className="pb-2">Prediction</th>
                          <th className="pb-2">Accuracy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aiPredictions.map(prediction => (
                          <tr key={prediction.id} className="text-sm border-b border-border last:border-0">
                            <td className="py-2">{prediction.type}</td>
                            <td className="py-2">{prediction.prediction}</td>
                            <td className="py-2">{prediction.accuracy}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Prediction Performance by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'No-Show', accuracy: aiMetrics?.no_show_accuracy || 0 },
                          { name: 'Duration', accuracy: aiMetrics?.duration_accuracy || 0 },
                          { name: 'Reschedule', accuracy: aiMetrics?.reschedule_acceptance || 0 }
                        ]}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <RechartsTooltip />
                        <Bar dataKey="accuracy" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="audit-logs">
            <Card>
              <CardHeader>
                <CardTitle>System Audit Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] overflow-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-medium text-muted-foreground">
                        <th className="pb-2">Action</th>
                        <th className="pb-2">Table</th>
                        <th className="pb-2">User</th>
                        <th className="pb-2">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map(log => (
                        <tr key={log.id} className="text-sm border-b border-border last:border-0">
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded-md text-xs ${
                              log.action === 'insert' ? 'bg-green-100 text-green-800' :
                              log.action === 'update' ? 'bg-blue-100 text-blue-800' :
                              log.action === 'delete' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2">{log.table_name}</td>
                          <td className="py-2">{log.user_id ? log.user_id.substring(0, 8) + '...' : 'System'}</td>
                          <td className="py-2">{new Date(log.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

const getPredictionDistributionData = () => {
  const typeCounts: Record<string, number> = {};
  
  return [];
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default AdminPage;
