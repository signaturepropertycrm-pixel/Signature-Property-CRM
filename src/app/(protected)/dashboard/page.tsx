
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Activity,
  ArrowUpRight,
  Building2,
  CalendarCheck,
  DollarSign,
  FileDown,
  FileUp,
  PlusCircle,
  Users,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const kpiData = [
  {
    title: 'Total Properties',
    value: '1,254',
    icon: Building2,
    color: 'bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300',
  },
  {
    title: 'Total Buyers',
    value: '821',
    icon: Users,
    color: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300',
  },
  {
    title: 'Active Follow-ups',
    value: '102',
    icon: CalendarCheck,
    color: 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300',
  },
  {
    title: 'Deals Closed (Month)',
    value: '12',
    icon: DollarSign,
    color: 'bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300',
  },
];

const recentActivities = [
  {
    user: 'Ali Khan',
    avatar: 'https://picsum.photos/seed/user1/40/40',
    action: 'added a new property',
    target: 'P-1255',
    time: '2m ago',
  },
  {
    user: 'Fatima Ahmed',
    avatar: 'https://picsum.photos/seed/user2/40/40',
    action: 'marked buyer as Interested',
    target: 'B-822',
    time: '15m ago',
  },
  {
    user: 'Demo Admin',
    avatar: 'https://picsum.photos/seed/user3/40/40',
    action: 'marked property as Sold',
    target: 'P-1198',
    time: '1h ago',
  },
  {
    user: 'Sana Javed',
    avatar: 'https://picsum.photos/seed/user4/40/40',
    action: 'set an appointment for',
    target: 'B-780',
    time: '3h ago',
  },
  {
    user: 'Ali Khan',
    avatar: 'https://picsum.photos/seed/user1/40/40',
    action: 'added a new buyer',
    target: 'B-823',
    time: '5h ago',
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
               <div className={cn("flex items-center justify-center rounded-full h-8 w-8", kpi.color)}>
                 <kpi.icon className="h-4 w-4" />
               </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">
                +5.2% from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Properties Added per Month</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-80">
            <p className="text-muted-foreground">Line Chart Placeholder</p>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Buyers by Status</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Pie Chart Placeholder</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button>
                <PlusCircle /> Add Property
              </Button>
              <Button>
                <PlusCircle /> Add Buyer
              </Button>
              <Button variant="secondary">
                <FileUp /> Import CSV
              </Button>
              <Button variant="secondary">
                <FileDown /> Export CSV
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center gap-4">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={activity.avatar}
                      alt="Avatar"
                      data-ai-hint="person portrait"
                    />
                    <AvatarFallback>
                      {activity.user.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-sm">
                    <span className="font-medium">{activity.user}</span>{' '}
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
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Agent Performance</CardTitle>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="#">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-80">
            <p className="text-muted-foreground">Bar Chart Placeholder</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
