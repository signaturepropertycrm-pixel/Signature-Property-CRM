
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CurrencyProvider } from '@/context/currency-context';
import { ProfileProvider, useProfile } from '@/context/profile-context';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { useUser } from '@/firebase/auth/use-user';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLoader } from '@/components/ui/loader';

function SuperAdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <AppLoader />
        </div>
    );
  }

  if (user?.email !== 'usmansagheer444@gmail.com') {
      return (
         <div className="flex h-screen w-full items-center justify-center p-4">
            <Card className="max-w-md text-center">
                <CardHeader>
                    <CardTitle>Access Denied</CardTitle>
                    <CardDescription>
                        You do not have permission to view this page.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
      )
  }

  return <>{children}</>;
}


export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
      <ProfileProvider>
        <CurrencyProvider>
            <SuperAdminAuthGuard>
                <div className="min-h-screen bg-muted/40">
                    {children}
                </div>
            </SuperAdminAuthGuard>
        </CurrencyProvider>
      </ProfileProvider>
    </FirebaseClientProvider>
  )
}
