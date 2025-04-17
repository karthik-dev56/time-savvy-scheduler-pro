
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter
} from "@/components/ui/sidebar";
import { Calendar, Clock, Users, Settings, Home, PieChart, Bell, User, ShieldCheck } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useRoleManagement } from '@/hooks/useRoleManagement';
import { Badge } from '@/components/ui/badge';

const AppSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { userRole, isAdminOrManager } = useRoleManagement();
  
  // Check for special admin session
  const specialAdminSession = sessionStorage.getItem('specialAdminSession');
  const isSpecialAdmin = specialAdminSession ? Boolean(JSON.parse(specialAdminSession)?.user_metadata?.is_super_admin) : false;
  
  // Also check user object directly 
  const isAdminUser = user?.user_metadata?.is_super_admin || (user?.app_metadata && user.app_metadata.role === 'admin') || isSpecialAdmin;
  
  const menuItems = [
    { title: "Dashboard", icon: Home, url: "/" },
    { title: "Calendar", icon: Calendar, url: "/calendar" },
    { title: "Appointments", icon: Clock, url: "/appointments" },
    { title: "Contacts", icon: Users, url: "/contacts" },
    { title: "Analytics", icon: PieChart, url: "/analytics" },
    { title: "Reminders", icon: Bell, url: "/reminders" },
    { title: "Settings", icon: Settings, url: "/settings" }
  ];

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center justify-center p-4">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <span className="text-sidebar-foreground font-bold text-xl">SmartSchedule</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url}
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon size={18} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <SidebarGroup>
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === "/profile"}
                  >
                    <Link to="/profile" className="flex items-center gap-3">
                      <User size={18} />
                      <span>Profile</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                {isAdminOrManager() || isAdminUser ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      isActive={location.pathname === "/admin"}
                    >
                      <Link to="/admin" className="flex items-center gap-3">
                        <ShieldCheck size={18} />
                        <span>Admin Panel</span>
                        {(isAdminUser || userRole === 'admin') && (
                          <Badge variant="outline" className="ml-auto text-xs bg-red-50 text-red-700 border-red-200">
                            Admin
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {user ? (user.email?.split('@')[0] || 'User') : 'Guest'}
            </p>
            <p className="text-xs text-sidebar-foreground/70">
              {isAdminUser ? 'admin account' : (userRole ? `${userRole} account` : (user ? user.email : 'Not signed in'))}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
