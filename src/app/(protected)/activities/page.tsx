
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History } from 'lucide-react';

const recentActivities = [
  {
    user: 'Ali Khan',
    action: 'added a new property',
    target: 'P-1255',
    time: '2m ago',
    role: 'Agent'
  },
  {
    user: 'Fatima Ahmed',
    action: 'marked buyer as Interested',
    target: 'B-822',
    time: '15m ago',
    role: 'Agent'
  },
  {
    user: 'Sana Javed',
    action: 'updated property details for',
    target: 'P-1198',
    time: '35m ago',
    role: 'Editor'
  },
  {
    user: 'Demo Admin',
    action: 'marked property as Sold',
    target: 'P-1198',
    time: '1h ago',
    role: 'Admin'
  },
  {
    user: 'Sana Javed',
    action: 'set an appointment for',
    target: 'B-780',
    time: '3h ago',
    role: 'Editor'
  },
  {
    user: 'Ali Khan',
    action: 'added a new buyer',
    target: 'B-823',
    time: '5h ago',
    role: 'Agent'
  },
   {
    user: 'Demo Admin',
    action: 'added a new team member',
    target: 'Zain Malik',
    time: '7h ago',
    role: 'Admin'
  },
  {
    user: 'Fatima Ahmed',
    action: 'updated property details for',
    target: 'P-1250',
    time: '8h ago',
    role: 'Agent'
  },
  {
    user: 'Demo Admin',
    action: 'deleted a buyer',
    target: 'B-799',
    time: '1d ago',
    role: 'Admin'
  },
  {
    user: 'Sana Javed',
    action: 'generated a shareable list for dealers',
    target: '5 properties',
    time: '2d ago',
    role: 'Editor'
  },
  {
    user: 'Ali Khan',
    action: 'updated buyer status to "Hot Lead"',
    target: 'B-821',
    time: '2d ago',
    role: 'Agent',
  },
  {
    user: 'Fatima Ahmed',
    action: 'added a new property',
    target: 'P-1256',
    time: '3d ago',
    role: 'Agent',
  },
  {
    user: 'Sana Javed',
    action: 'restored property from trash',
    target: 'P-1190',
    time: '4d ago',
    role: 'Editor',
  },
  {
    user: 'Demo Admin',
    action: 'changed role for Ali Khan to',
    target: 'Agent',
    time: '5d ago',
    role: 'Admin',
  },
  {
    user: 'Ali Khan',
    action: 'set an appointment for',
    target: 'B-815',
    time: '6d ago',
    role: 'Agent',
  },
  {
    user: 'Fatima Ahmed',
    action: 'marked property as Sold',
    target: 'P-1245',
    time: '1w ago',
    role: 'Agent',
  },
   {
    user: 'Demo Admin',
    action: 'permanently deleted property',
    target: 'P-1180',
    time: '1w ago',
    role: 'Admin',
  },
  {
    user: 'Sana Javed',
    action: 'added a new buyer',
    target: 'B-824',
    time: '2w ago',
    role: 'Editor',
  },
  {
    user: 'Ali Khan',
    action: 'updated property details for',
    target: 'P-1252',
    time: '3w ago',
    role: 'Agent',
  },
];

export default function ActivitiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Activities
        </h1>
        <p className="text-muted-foreground">
          Track all recent activities in the system.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-4 border-b pb-4 last:border-b-0 last:pb-0"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                    <History className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 text-sm">
                  <span className="font-medium">{activity.user}</span>{' '}
                  <span className="text-muted-foreground">({activity.role})</span>{' '}
                  {activity.action}{' '}
                  <Badge variant="outline" className="font-mono">
                    {activity.target}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {activity.time}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
