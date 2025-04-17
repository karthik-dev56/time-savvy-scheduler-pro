
import React from 'react';
import Layout from '@/components/Layout';
import AppointmentDisplay from '@/components/AppointmentDisplay';

const SupabaseData = () => {
  return (
    <Layout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Supabase Appointment Data</h1>
        <p className="text-muted-foreground mb-8">
          This page displays appointment data fetched directly from the Supabase database.
        </p>
        <AppointmentDisplay />
      </div>
    </Layout>
  );
};

export default SupabaseData;
