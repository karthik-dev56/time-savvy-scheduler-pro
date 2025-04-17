
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "./components/ui/sidebar";
import { useAuth } from "./hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ProfilePage from "./pages/Profile";
import AdminPage from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route component to handle redirects
const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode, requiredRole?: string }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  // Special admin check for admin credentials stored in sessionStorage
  const specialAdminSession = sessionStorage.getItem('specialAdminSession');
  if (requiredRole === 'admin' && specialAdminSession) {
    try {
      const adminUser = JSON.parse(specialAdminSession);
      if (adminUser && adminUser.user_metadata?.is_super_admin) {
        return <>{children}</>;
      }
    } catch (error) {
      console.error("Error parsing admin session:", error);
    }
  }
  
  // If we're requiring admin role, check for admin privileges
  if (requiredRole === 'admin') {
    // If user has admin privileges in user_metadata or app_metadata
    if (user.user_metadata?.is_super_admin || user.app_metadata?.role === 'admin') {
      return <>{children}</>;
    } else {
      // Not admin, redirect to home
      console.log("User not admin, redirecting to home");
      return <Navigate to="/" replace />;
    }
  }
  
  // For non-admin protected routes
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SidebarProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SidebarProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
