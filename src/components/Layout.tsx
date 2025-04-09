
import React from 'react';
import AppSidebar from './AppSidebar';
import UserMenu from './UserMenu';
import { SidebarInset } from "@/components/ui/sidebar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex bg-background w-full">
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <header className="border-b h-16 flex items-center px-6 justify-end">
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
