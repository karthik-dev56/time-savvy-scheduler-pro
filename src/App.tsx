import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';

import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Admin from '@/pages/Admin';
import Profile from '@/pages/Profile';
import NotFound from '@/pages/NotFound';
import SupabaseData from '@/pages/SupabaseData';

import './App.css';

function App() {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <div className="app">
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/supabase-data" element={<SupabaseData />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
