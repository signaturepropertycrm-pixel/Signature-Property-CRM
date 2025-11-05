
'use client';

import React, { useState } from 'react';
import { AppSidebar } from '@/components/shared/sidebar';
import { AppHeader } from '@/components/shared/header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';

// A simple React context to manage global search state
const SearchContext = React.createContext<{
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}>({
  searchQuery: '',
  setSearchQuery: () => {},
});

export const useSearch = () => React.useContext(SearchContext);


export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const pathname = usePathname();
  const isSearchable = pathname.startsWith('/properties') || pathname.startsWith('/buyers');

  // Reset search when navigating away from searchable pages
  React.useEffect(() => {
    if (!isSearchable) {
      setSearchQuery('');
    }
  }, [isSearchable, pathname]);


  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      <SidebarProvider>
        <div className="flex h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <AppHeader 
              searchable={isSearchable}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 page-transition">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </SearchContext.Provider>
  );
}

    