
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { activities } from '@/lib/data';
import { formatDistanceToNow } from 'date-fns';
import {
  FilePlus,
  UserPlus,
  Edit,
  CheckCircle,
  CalendarPlus,
  ArrowRight,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

const getActionIcon = (action: string) => {
  if (action.includes('added a new property')) return <FilePlus className="h-4 w-4" />;
  if (action.includes('added a new buyer')) return <UserPlus className="h-4 w-4" />;
  if (action.includes('updated the status')) return <Edit className="h-4 w-4" />;
  if (action.includes('marked a property as "Sold"')) return <CheckCircle className="h-4 w-4" />;
  if (action.includes('scheduled an appointment')) return <CalendarPlus className="h-4 w-4" />;
  return <Edit className="h-4 w-4" />;
};


export default function ActivitiesPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Recent Activities
        </h1>
        <p className="text-muted-foreground">
          A log of all major actions taken within the system.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flow-root">
            <ul className="divide-y divide-border">
              {activities.map((activity, activityIdx) => (
                <li key={activity.id} className="relative p-6 hover:bg-accent/50 transition-colors">
                  <div className="relative flex items-start gap-4">
                     <div className="absolute left-6 top-6 h-full w-px bg-border -translate-x-1/2" aria-hidden="true" />
                     <div className="relative flex h-10 w-10 flex-none items-center justify-center bg-card rounded-full ring-1 ring-border">
                       <div className="text-primary">
                         {getActionIcon(activity.action)}
                       </div>
                     </div>
                    <div className="flex-auto pt-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{activity.userName}</span>
                        <span className="text-muted-foreground text-sm">{activity.action}</span>
                      </div>
                      <p className="font-semibold text-primary">{activity.target}</p>

                      {activity.details && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <Badge variant="secondary">{activity.details.from}</Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="default">{activity.details.to}</Badge>
                        </div>
                      )}
                      
                       <time dateTime={activity.timestamp} className="block flex-none text-xs text-muted-foreground mt-2">
                        {isMounted ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : null}
                      </time>
                    </div>
                     <div className="absolute right-0 top-0 text-muted-foreground">
                        <Badge variant="outline">{activity.targetType}</Badge>
                     </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
