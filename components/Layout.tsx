
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="bg-background text-foreground">
      <Sidebar isMobileNavOpen={isMobileNavOpen} closeMobileNav={() => setIsMobileNavOpen(false)} />
      <div className="md:pl-64 flex flex-col h-screen">
        <Header onMobileNavToggle={() => setIsMobileNavOpen(o => !o)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
