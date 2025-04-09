
import React, { useState } from 'react';
import Layout from '../components/Layout';
import Dashboard from '../components/Dashboard';
import NewAppointment from '../components/NewAppointment';
import AppointmentCalendar from '../components/AppointmentCalendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="new">New Appointment</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>
          <TabsContent value="calendar">
            <AppointmentCalendar />
          </TabsContent>
          <TabsContent value="new">
            <NewAppointment />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Index;
