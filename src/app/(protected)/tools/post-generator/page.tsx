
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket } from 'lucide-react';

export default function PostGeneratorPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <Card className="max-w-md w-full">
            <CardHeader>
                <div className="flex justify-center mb-4">
                    <Rocket className="h-16 w-16 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold font-headline text-center">
                    Coming Soon!
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    The Post Generator tool is currently under development. Stay tuned for an amazing feature that will help you create social media posts for your properties automatically!
                </p>
            </CardContent>
        </Card>
    </div>
  );
}
