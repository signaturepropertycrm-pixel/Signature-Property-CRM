
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const recentActivities = [
  {
    user: 'Ali Khan',
    avatar: 'https://picsum.photos/seed/user1/40/40',
    action: 'added a new property',
    target: 'P-1255',
    time: '2m ago',
    role: 'Agent'
  },
  {
    user: 'Fatima Ahmed',
    avatar: 'https://picsum.photos/seed/user2/40/40',
    action: 'marked buyer as Interested',
    target: 'B-822',
    time: '15m ago',
    role: 'Agent'
  },
  {
    user: 'Sana Javed',
    avatar: 'https://picsum.photos/seed/user4/40/40',
    action: 'updated property details for',
    target: 'P-1198',
    time: '35m ago',
    role: 'Editor'
  },
  {
    user: 'Demo Admin',
    avatar: 'https://picsum.photos/seed/user3/40/40',
    action: 'marked property as Sold',
    target: 'P-1198',
    time: '1h ago',
    role: 'Admin'
  },
  {
    user: 'Sana Javed',
    avatar: 'https://picsum.photos/seed/user4/40/40',
    action: 'set an appointment for',
    target: 'B-780',
    time: '3h ago',
    role: 'Editor'
  },
  {
    user: 'Ali Khan',
    avatar: 'https://picsum.photos/seed/user1/40/40',
    action: 'added a new buyer',
    target: 'B-823',
    time: '5h ago',
    role: 'Agent'
  },
   {
    user: 'Demo Admin',
    avatar: 'https://picsum.photos/seed/user3/40/40',
    action: 'added a new team member',
    target: 'Zain Malik',
    time: '7h ago',
    role: 'Admin'
  },
  {
    user: 'Fatima Ahmed',
    avatar: 'https://picsum.photos/seed/user2/40/40',
    action: 'updated property details for',
    target: 'P-1250',
    time: '8h ago',
    role: 'Agent'
  },
  {
    user: 'Demo Admin',
    avatar: 'https://picsum.photos/seed/user3/40/40',
    action: 'deleted a buyer',
    target: 'B-799',
    time: '1d ago',
    role: 'Admin'
  },
  {
    user: 'Sana Javed',
    avatar: 'https://picsum.photos/seed/user4/40/40',
    action: 'generated a shareable list for dealers',
    target: '5 properties',
    time: '2d ago',
    role: 'Editor'
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
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={activity.avatar}
                    alt="Avatar"
                    data-ai-hint="person portrait"
                  />
                  <AvatarFallback>{activity.user.charAt(0)}</AvatarFallback>
                </Avatar>
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
