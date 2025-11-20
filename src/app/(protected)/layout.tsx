
'use client';

import React, { useState } from 'react';
import { AppSidebar } from '@/components/shared/sidebar';
import { AppHeader } from '@/components/shared/header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { CurrencyProvider } from '@/context/currency-context';
import { useProfile, ProfileProvider } from '@/context/profile-context';
import { useUser } from '@/firebase';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useMemoFirebase } from '@/firebase/hooks';

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
  const { profile, isLoading: isProfileLoading } = useProfile();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || isProfileLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading Your Workspace...</p>
            </div>
        </div>
    );
  }
  
  if (!user) {
    return null; // or a redirect component
  }

  // Check if user has the required role for the current page
  if (profile.role !== 'Admin') {
    if (pathname.startsWith('/team') || pathname.startsWith('/settings') || pathname.startsWith('/upgrade') || pathname.startsWith('/activities') || pathname.startsWith('/trash')) {
        router.push('/dashboard');
        return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
  }
  if (profile.role === 'Agent') {
     if (pathname.startsWith('/tools') || pathname.startsWith('/analytics')) {
        router.push('/dashboard');
        return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
  }


  return <>{children}</>;
}

function ProtectedLayoutContent({ children }: { children: React.ReactNode }) {
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
    </SearchContext.Provider>
  );
}


export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
        <CurrencyProvider>
          <ProtectedLayoutContent>
            {children}
          </ProtectedLayoutContent>
        </CurrencyProvider>
    </FirebaseClientProvider>
  )
}
