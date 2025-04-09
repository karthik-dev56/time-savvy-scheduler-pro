
import React from 'react';
import AppSidebar from './AppSidebar';
import UserMenu from './UserMenu';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />
      <div className="flex-1">
        <header className="border-b h-16 flex items-center px-6 justify-end">
          <UserMenu />
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
