
'use client';
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowUpRight,
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckCheck,
  CheckCircle,
  DollarSign,
  Flame,
  PhoneForwarded,
  Star,
  TrendingDown,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { subDays, isWithinInterval } from 'date-fns';
import { useCurrency } from '@/context/currency-context';
import { formatCurrency } from '@/lib/formatters';
import { PerformanceChart } from '@/components/performance-chart';
import { Property, Buyer, Appointment, FollowUp, User } from '@/lib/types';
import { AnalyticsChart } from '@/components/analytics-chart';
import { TeamPerformanceChart } from '@/components/team-performance-chart';

type KpiData = {
  id: string;
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  change: string;
};


export default function DashboardPage() {
  const { currency } = useCurrency();
  const [kpiData, setKpiData] = useState<KpiData[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);

  useEffect(() => {
    const propertiesData = JSON.parse(localStorage.getItem('properties') || '[]') as Property[];
    setProperties(propertiesData);
    
    const buyersData = JSON.parse(localStorage.getItem('buyers') || '[]') as Buyer[];
    setBuyers(buyersData);

    const appointmentsData = JSON.parse(localStorage.getItem('appointments') || '[]') as Appointment[];
    setAppointments(appointmentsData);
    
    const followUpsData = JSON.parse(localStorage.getItem('followUps') || '[]') as FollowUp[];
    setFollowUps(followUpsData);

    const teamMembersData = JSON.parse(localStorage.getItem('teamMembers') || '[]') as User[];
    setTeamMembers(teamMembersData);

    const now = new Date();
    const last30Days = subDays(now, 30);
    
    const getChange = (current: number, previous: number) => {
        if (previous === 0) {
            return current > 0 ? `+${current}` : 'No change';
        }
        const percentageChange = ((current - previous) / previous) * 100;
        return percentageChange > 0 ? `+${percentageChange.toFixed(1)}%` : `${percentageChange.toFixed(1)}%`;
    }

    const propertiesInLast30Days = propertiesData.filter(p => isWithinInterval(new Date(p.created_at), { start: last30Days, end: now })).length;
    const previousPropertiesCount = propertiesData.length - propertiesInLast30Days;
    
    const buyersInLast30Days = buyersData.filter(b => isWithinInterval(new Date(b.created_at), { start: last30Days, end: now })).length;
    const previousBuyersCount = buyersData.length - buyersInLast30Days;
    
    const soldInLast30Days = propertiesData.filter(p => p.status === 'Sold' && p.sold_at && isWithinInterval(new Date(p.sold_at), { start: last30Days, end: now }));
    const totalSoldCount = propertiesData.filter(p => p.status === 'Sold').length;
    const previousSoldCount = totalSoldCount - soldInLast30Days.length;
    
    const revenueInLast30Days = soldInLast30Days.reduce((acc, p) => acc + (p.sold_price || 0), 0);
    const totalRevenue = propertiesData.filter(p => p.status === 'Sold' && p.sold_price).reduce((acc, p) => acc + (p.sold_price || 0), 0);
    const previousRevenue = totalRevenue - revenueInLast30Days;


    const updatedKpiData: KpiData[] = [
      {
        id: 'total-properties',
        title: 'Total Properties',
        value: propertiesData.length.toString(),
        icon: Building2,
        color: 'bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300',
        change: getChange(propertiesData.length, previousPropertiesCount),
      },
      {
        id: 'total-buyers',
        title: 'Total Buyers',
        value: buyersData.length.toString(),
        icon: Users,
        color: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300',
        change: getChange(buyersData.length, previousBuyersCount),
      },
      {
        id: 'properties-sold',
        title: 'Properties Sold (30d)',
        value: soldInLast30Days.length.toString(),
        icon: DollarSign,
        color: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300',
        change: getChange(soldInLast30Days.length, previousSoldCount),
      },
      {
        id: 'monthly-revenue',
        title: 'Revenue (30d)',
        value: formatCurrency(revenueInLast30Days, currency, { notation: 'compact' }),
        icon: DollarSign,
        color: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',
        change: getChange(revenueInLast30Days, previousRevenue),
      },
       {
        id: 'interested-buyers',
        title: 'Interested Buyers',
        value: buyersData.filter((b: any) => b.status === 'Interested').length.toString(),
        icon: Star,
        color: 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300',
        change: `${buyersData.filter(b => b.status === 'Interested' && isWithinInterval(new Date(b.created_at), { start: last30Days, end: now })).length} new`,
      },
      {
        id: 'hot-leads',
        title: 'Hot Leads',
        value: buyersData.filter((b: any) => b.status === 'Hot Lead').length.toString(),
        icon: Flame,
        color: 'bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300',
        change: `${buyersData.filter(b => b.status === 'Hot Lead' && isWithinInterval(new Date(b.created_at), { start: last30Days, end: now })).length} new`,
      },
      {
        id: 'follow-up-leads',
        title: 'Follow-up Leads',
        value: followUpsData.length.toString(),
        icon: PhoneForwarded,
        color: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300',
        change: `${followUpsData.filter((f: any) => new Date(f.nextReminder) <= now).length} due`,
      },
       {
        id: 'appointments-month',
        title: 'Appointments (30d)',
        value: appointmentsData.filter((a: any) => isWithinInterval(new Date(a.date), { start: last30Days, end: now })).length.toString(),
        icon: CalendarDays,
        color: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-300',
        change: `${appointmentsData.filter((a: any) => a.status === 'Scheduled' && new Date(a.date) >= now).length} upcoming`,
      },
       {
        id: 'completed-month',
        title: 'Completed (30d)',
        value: appointmentsData.filter((a: any) => a.status === 'Completed' && isWithinInterval(new Date(a.date), { start: last30Days, end: now })).length.toString(),
        icon: CheckCheck,
        color: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',
        change: 'Keep it up!',
      },
        {
        id: 'cancelled-month',
        title: 'Cancelled (30d)',
        value: appointmentsData.filter((a: any) => a.status === 'Cancelled' && isWithinInterval(new Date(a.date), { start: last30Days, end: now })).length.toString(),
        icon: XCircle,
        color: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300',
        change: 'Review reasons',
      },
    ];

    setKpiData(updatedKpiData);

  }, [currency, properties, buyers, appointments, followUps]);
  
  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpiData.map((kpi) => (
          <Card key={kpi.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
               <div className={cn("flex items-center justify-center rounded-full h-8 w-8", kpi.color)}>
                 <kpi.icon className="h-4 w-4" />
               </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className={cn(
                "text-xs text-muted-foreground",
                kpi.change.startsWith('+') && "text-green-600",
                kpi.change.startsWith('-') && "text-red-600"
              )}>
                {kpi.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-8">
        <PerformanceChart properties={properties} />
        <AnalyticsChart buyers={buyers} />
        <TeamPerformanceChart teamMembers={teamMembers} />
      </div>
    </div>
  );
}
