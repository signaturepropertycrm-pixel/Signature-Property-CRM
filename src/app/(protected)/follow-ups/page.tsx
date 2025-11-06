
'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { followUps as initialFollowUps } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, MessageSquare, CalendarPlus, CheckCircle } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useEffect, useState } from 'react';
import { FollowUp } from '@/lib/types';


const statusConfig = {
  'Due Soon': { variant: 'destructive', label: 'Due Soon' },
  'Completed': { variant: 'default', label: 'Completed' },
  'Scheduled': { variant: 'secondary', label: 'Scheduled' },
} as const;

export default function FollowUpsPage() {
  const agentAvatar = PlaceHolderImages.find(p => p.id === 'avatar-agent');
  const [followUpsData, setFollowUpsData] = useState<FollowUp[]>([]);

  useEffect(() => {
    const savedFollowUps = localStorage.getItem('followUps');
    if (savedFollowUps) {
      setFollowUpsData(JSON.parse(savedFollowUps));
    } else {
      setFollowUpsData(initialFollowUps);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Follow-ups</h1>
        <p className="text-muted-foreground">Track and manage your follow-ups.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {followUpsData.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-10">No follow-ups scheduled.</p>
        ) : (
          followUpsData.map((followUp) => (
            <Card key={followUp.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={agentAvatar?.imageUrl} data-ai-hint={agentAvatar?.imageHint} />
                      <AvatarFallback>{followUp.buyerName.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="font-headline text-lg">{followUp.buyerName}</CardTitle>
                      <CardDescription>{followUp.propertyInterest}</CardDescription>
                    </div>
                  </div>
                   <Badge variant={statusConfig[followUp.status].variant}>
                    {statusConfig[followUp.status].label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <div className="text-sm text-muted-foreground space-y-1">
                   <p><strong>Last Contact:</strong> {new Date(followUp.lastContactDate).toLocaleDateString()}</p>
                   <p><strong>Next Reminder:</strong> {new Date(followUp.nextReminder).toLocaleDateString()}</p>
                </div>
                <p className="text-sm border-t pt-3">{followUp.notes}</p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="icon"><Phone /></Button>
                <Button variant="outline" size="icon"><MessageSquare /></Button>
                <Button variant="outline" size="icon"><CalendarPlus /></Button>
                <Button size="icon"><CheckCircle /></Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

    