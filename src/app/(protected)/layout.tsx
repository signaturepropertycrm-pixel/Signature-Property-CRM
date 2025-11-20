
'use client';

import React, { useState } from 'react';
import { AppSidebar } from '@/components/shared/sidebar';
import { AppHeader } from '@/components/shared/header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { CurrencyProvider } from '@/context/currency-context';
import { useProfile } from '@/context/profile-context';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { useUser } from '@/firebase/auth/use-user';
import { Loader2 } from 'lucide-react';
import { useMemoFirebase } from '@/firebase/hooks';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

  // Define restricted paths for each role
  const adminOnlyPaths = ['/team', '/settings', '/upgrade'];
  const editorForbiddenPaths = ['/team', '/settings', '/upgrade'];
  const agentForbiddenPaths = ['/team', '/settings', 'upgrade', '/tools', '/analytics', '/trash', '/activities'];


  let isAllowed = true;
  let message = "This page is not accessible with your current role.";

  if (profile.role === 'Editor' && editorForbiddenPaths.some(path => pathname.startsWith(path))) {
      isAllowed = false;
  } else if (profile.role === 'Agent' && agentForbiddenPaths.some(path => pathname.startsWith(path))) {
      isAllowed = false;
  }
  
  if (!isAllowed) {
      return (
         <div className="flex h-screen w-full items-center justify-center p-4">
            <Card className="max-w-md text-center">
                <CardHeader>
                    <CardTitle>Access Denied</CardTitle>
                    <CardDescription>
                        {message}
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
      )
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

    