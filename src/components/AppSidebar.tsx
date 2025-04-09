
import React from 'react';
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
import { Calendar, Clock, Users, Settings, Home, PieChart, Bell } from "lucide-react";

const menuItems = [
  { title: "Dashboard", icon: Home, url: "/" },
  { title: "Calendar", icon: Calendar, url: "/calendar" },
  { title: "Appointments", icon: Clock, url: "/appointments" },
  { title: "Contacts", icon: Users, url: "/contacts" },
  { title: "Analytics", icon: PieChart, url: "/analytics" },
  { title: "Reminders", icon: Bell, url: "/reminders" },
  { title: "Settings", icon: Settings, url: "/settings" }
];

const AppSidebar = () => {
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
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="flex items-center gap-3">
                      <item.icon size={18} />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">User Profile</p>
            <p className="text-xs text-sidebar-foreground/70">user@example.com</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
