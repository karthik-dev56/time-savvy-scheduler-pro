
import React, { useEffect } from 'react';
import Layout from '@/components/Layout';
import AppointmentDisplay from '@/components/AppointmentDisplay';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

const SupabaseData = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { state: { returnPath: '/supabase-data' } });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold mb-6">Loading...</h1>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto py-8 flex flex-col items-center">
          <Shield className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">Please sign in to view your appointment data</p>
          <Button onClick={() => navigate('/auth', { state: { returnPath: '/supabase-data' } })}>
            Go to Sign In
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Your Supabase Appointment Data</h1>
        <p className="text-muted-foreground mb-8">
          This page displays your personal appointment data from the Supabase database.
        </p>
        <AppointmentDisplay />
      </div>
    </Layout>
  );
};

export default SupabaseData;
