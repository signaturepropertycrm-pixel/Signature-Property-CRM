
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CurrencyProvider } from '@/context/currency-context';
import { ProfileProvider } from '@/context/profile-context';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { useUser } from '@/firebase/auth/use-user';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLoader } from '@/components/ui/loader';
import { LayoutDashboard, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

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
                <div className="flex min-h-screen bg-muted/40">
                    <aside className="w-64 flex-shrink-0 border-r bg-background p-4">
                        <div className="flex h-16 items-center px-2">
                           <h1 className="text-xl font-bold font-headline">Admin Panel</h1>
                        </div>
                        <Separator className="my-4" />
                        <nav className="flex flex-col gap-2">
                            <Button variant="ghost" className="justify-start gap-2" asChild>
                                <Link href="/super-admin">
                                    <LayoutDashboard />
                                    Dashboard
                                </Link>
                            </Button>
                             <Button variant="ghost" className="justify-start gap-2" asChild>
                                <Link href="/overview">
                                    <ArrowLeft />
                                    Back to CRM
                                </Link>
                            </Button>
                        </nav>
                    </aside>
                    <main className="flex-1 p-4 sm:p-6 lg:p-8">
                        {children}
                    </main>
                </div>
            </SuperAdminAuthGuard>
        </CurrencyProvider>
      </ProfileProvider>
    </FirebaseClientProvider>
  )
}
