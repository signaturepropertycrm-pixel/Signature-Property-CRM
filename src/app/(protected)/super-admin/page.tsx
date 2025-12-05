
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';
import { useProfile } from '@/context/profile-context';
import { AppLoader } from '@/components/ui/loader';

export default function SuperAdminPage() {
    const { profile, isLoading } = useProfile();

    if (isLoading) {
        return (
             <div className="flex h-screen w-full items-center justify-center bg-background">
                <AppLoader />
            </div>
        )
    }

    // This is a basic check. In a real app, you'd have a separate, secure way 
    // to identify super admins (e.g., a specific UID or a custom claim).
    if (profile.email !== 'demo_admin@signaturecrm.test') {
        return (
            <div className="flex h-full items-center justify-center">
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


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
          <ShieldCheck />
          Super Admin Panel
        </h1>
        <p className="text-muted-foreground">
          Manage agencies and plan upgrade requests.
        </p>
      </div>
      
       <Card>
        <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
                This section will display all upgrade requests from agencies for you to review and approve.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">Stay tuned!</p>
        </CardContent>
      </Card>
      
    </div>
  );
}
