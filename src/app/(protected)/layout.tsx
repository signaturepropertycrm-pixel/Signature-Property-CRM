
'use client';

import React, { useState } from 'react';
import { AppSidebar } from '@/components/shared/sidebar';
import { AppHeader } from '@/components/shared/header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { CurrencyProvider } from '@/context/currency-context';
import { ProfileProvider, useProfile } from '@/context/profile-context';
import { FirebaseClientProvider, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';

// A simple React context to manage global search state
const SearchContext = React.createContext<{
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}>({
  searchQuery: '',
  setSearchQuery: () => {},
});

export const useSearch = () => React.useContext(SearchContext);

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const { isLoading: isProfileLoading } = useProfile();
  const router = useRouter();

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || isProfileLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Loading...</p>
        </div>
    );
  }
  
  if (!user) {
    return null; // or a redirect component
  }

  return <>{children}</>;
}


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
  }, [isSearchable]);


  return (
      <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
          <CurrencyProvider>
          <SidebarProvider>
              <AuthGuard>
                <div className="flex h-screen w-full bg-background">
                <AppSidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                    <AppHeader 
                    searchable={isSearchable}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    />
                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {children}
                    </main>
                </div>
                </div>
              </AuthGuard>
          </SidebarProvider>
          </CurrencyProvider>
      </SearchContext.Provider>
  );
}
