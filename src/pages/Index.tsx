
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import Dashboard from '../components/Dashboard';
import SmartNewAppointment from '../components/SmartNewAppointment';
import AppointmentCalendar from '../components/AppointmentCalendar';
import NotificationSettings from '../components/NotificationSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoleManagement } from '@/hooks/useRoleManagement';
import { Settings } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldCheck } from 'lucide-react';

const Index = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { userRole } = useRoleManagement();

  useEffect(() => {
    // Check if location state contains an activeTab
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {userRole === 'admin' && (
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Admin Access Granted</AlertTitle>
            <AlertDescription className="text-blue-700">
              You have administrator privileges. You can manage users and view audit logs in the <a href="/admin" className="font-medium underline">Admin Panel</a>.
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="new">New Appointment</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>
          <TabsContent value="calendar">
            <AppointmentCalendar />
          </TabsContent>
          <TabsContent value="new">
            <SmartNewAppointment />
          </TabsContent>
          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>
          <TabsContent value="settings">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Account Settings</h2>
              <p>This section will contain account settings and preferences.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Index;
