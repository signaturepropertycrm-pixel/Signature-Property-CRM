
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History } from 'lucide-react';

export default function ActivitiesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <Card className="max-w-md w-full">
            <CardHeader>
                <div className="flex justify-center mb-4">
                    <History className="h-16 w-16 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold font-headline text-center">
                    Coming Soon!
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    The Activities page is currently under development. Soon, you will be able to view a complete log of all major actions taken within the system right here!
                </p>
            </CardContent>
        </Card>
    </div>
  );
}
