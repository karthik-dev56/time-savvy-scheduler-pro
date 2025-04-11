
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/useAuth';
import { useRoleManagement } from '@/hooks/useRoleManagement';
import { supabase, getAIPredictionMetrics, getAIPredictions } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import type { AIPredictionMetrics, AIPrediction } from '@/integrations/supabase/client';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const AdminPage = () => {
  const { user } = useAuth();
  const { checkRole, userRole } = useRoleManagement();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State for AI metrics and predictions
  const [aiMetrics, setAiMetrics] = useState<AIPredictionMetrics | null>(null);
  const [aiPredictions, setAiPredictions] = useState<AIPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  // Check if user has admin role
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }
      
      const isAdmin = await checkRole('admin');
      
      if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "You do not have permission to access the admin page.",
          variant: "destructive",
        });
        navigate('/');
      }
    };
    
    checkAdminAccess();
  }, [user, checkRole, navigate, toast]);
  
  // Fetch AI metrics and predictions
  useEffect(() => {
    const fetchAIData = async () => {
      try {
        setLoading(true);
        
        // Fetch AI metrics
        const metrics = await getAIPredictionMetrics();
        setAiMetrics(metrics);
        console.log("Fetched AI metrics:", metrics);
        
        // Fetch AI predictions
        const predictions = await getAIPredictions(10);
        setAiPredictions(predictions);
        console.log("Fetched AI predictions:", predictions);
        
        // Fetch audit logs
        const { data: logs, error: logsError } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
          
        if (logsError) {
          console.error("Error fetching audit logs:", logsError);
        } else {
          setAuditLogs(logs || []);
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
    
    if (user && userRole === 'admin') {
      fetchAIData();
    }
  }, [user, userRole, toast]);
  
  // Generate data for prediction accuracy chart
  const getPredictionAccuracyData = () => {
    // Create sample data for demonstration
    return [
      { name: 'Jan', accuracy: 87 },
      { name: 'Feb', accuracy: 89 },
      { name: 'Mar', accuracy: 91 },
      { name: 'Apr', accuracy: 93 },
      { name: 'May', accuracy: 94 },
      { name: 'Jun', accuracy: 92 },
    ];
  };

  // Generate data for prediction distribution chart  
  const getPredictionDistributionData = () => {
    const typeCounts: Record<string, number> = {};
    
    aiPredictions.forEach(prediction => {
      const type = prediction.type || 'Unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    return Object.keys(typeCounts).map(type => ({ name: type, value: typeCounts[type] }));
  };
  
  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ai-metrics">AI Metrics</TabsTrigger>
            <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* User Count Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">152</p>
                  <p className="text-xs text-muted-foreground">+12 from last week</p>
                </CardContent>
              </Card>
              
              {/* Appointments Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Active Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">48</p>
                  <p className="text-xs text-muted-foreground">+8 from last week</p>
                </CardContent>
              </Card>
              
              {/* System Status Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                    <p className="font-medium">All systems operational</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Last checked: 5 minutes ago</p>
                </CardContent>
              </Card>
            </div>
            
            {/* AI Predictions Overview Chart */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>AI Prediction Accuracy Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={getPredictionAccuracyData()}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="accuracy" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="ai-metrics">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* No-Show Accuracy */}
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
              
              {/* Duration Accuracy */}
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
              
              {/* Reschedule Acceptance */}
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
            
            {/* AI Metrics Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prediction Distribution */}
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
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Recent Predictions */}
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
              
              {/* Prediction Performance */}
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
                        <Tooltip />
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
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Admin Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">User Management</h3>
                    <p className="text-muted-foreground text-sm mb-2">
                      Manage system users and permissions
                    </p>
                    <Button>Manage Users</Button>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">System Configuration</h3>
                    <p className="text-muted-foreground text-sm mb-2">
                      Configure system settings and defaults
                    </p>
                    <Button variant="outline">Edit Configuration</Button>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">AI Training</h3>
                    <p className="text-muted-foreground text-sm mb-2">
                      Manage AI training data and prediction models
                    </p>
                    <Button variant="outline">View Training Data</Button>
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
