
import React, { useState } from 'react';
import AppSidebar from './AppSidebar';
import UserMenu from './UserMenu';
import { SidebarInset } from "@/components/ui/sidebar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-background w-full">
      <AppSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <SidebarInset className="flex flex-col">
        <header className="border-b h-16 flex items-center px-6 justify-between">
          <button 
            className="p-2 rounded-md hover:bg-accent" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span className="sr-only">Toggle sidebar</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          </button>
          <UserMenu />
        </header>
        <main className="p-6 flex-1">
          {children}
        </main>
      </SidebarInset>
    </div>
  );
};

export default Layout;
