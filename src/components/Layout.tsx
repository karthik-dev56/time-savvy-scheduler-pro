
import React from 'react';
import UserMenu from './UserMenu';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex bg-background w-full">
      <main className="flex-1 flex flex-col">
        <header className="border-b h-16 flex items-center px-6 justify-between">
          <div></div>
          <UserMenu />
        </header>
        <div className="p-6 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
