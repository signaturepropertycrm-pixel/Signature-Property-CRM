
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
import { appointments as initialAppointments, properties as initialProperties, buyers as initialBuyers, followUps as initialFollowUps } from '@/lib/data';
import { subMonths, isWithinInterval } from 'date-fns';
import { useCurrency } from '@/context/currency-context';
import { formatCurrency } from '@/lib/formatters';
import { PerformanceChart } from '@/components/performance-chart';
import { Property } from '@/lib/types';

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

  useEffect(() => {
    const propertiesData = JSON.parse(localStorage.getItem('properties') || '[]') || initialProperties;
    setProperties(propertiesData);
    
    const buyers = JSON.parse(localStorage.getItem('buyers') || '[]') || initialBuyers;
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]') || initialAppointments;
    const followUps = JSON.parse(localStorage.getItem('followUps') || '[]') || initialFollowUps;

    const lastMonth = subMonths(new Date(), 1);
    const now = new Date();

    const appointmentsLastMonth = appointments.filter((a: any) => isWithinInterval(new Date(a.date), { start: lastMonth, end: now }));
    const completedLastMonth = appointmentsLastMonth.filter((a: any) => a.status === 'Completed').length;
    const cancelledLastMonth = appointmentsLastMonth.filter((a: any) => a.status === 'Cancelled').length;

    const totalRevenue = propertiesData.filter((p: any) => p.status === 'Sold').reduce((acc: number, p: any) => acc + (p.sold_price || 0), 0);

    const updatedKpiData: KpiData[] = [
      {
        id: 'total-properties',
        title: 'Total Properties',
        value: propertiesData.length.toString(),
        icon: Building2,
        color: 'bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300',
        change: '+2.1%',
      },
      {
        id: 'total-buyers',
        title: 'Total Buyers',
        value: buyers.length.toString(),
        icon: Users,
        color: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300',
        change: '+8.5%',
      },
      {
        id: 'properties-sold',
        title: 'Properties Sold (Month)',
        value: propertiesData.filter((p: any) => p.status === 'Sold' && isWithinInterval(new Date(p.sold_at), { start: lastMonth, end: now })).length.toString(),
        icon: DollarSign,
        color: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300',
        change: '+15%',
      },
      {
        id: 'monthly-revenue',
        title: 'Monthly Revenue',
        value: formatCurrency(totalRevenue, currency, { notation: 'compact' }),
        icon: DollarSign,
        color: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',
        change: '+20.1%',
      },
       {
        id: 'interested-buyers',
        title: 'Interested Buyers',
        value: buyers.filter((b: any) => b.status === 'Interested').length.toString(),
        icon: Star,
        color: 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300',
        change: '+10',
      },
      {
        id: 'hot-leads',
        title: 'Hot Leads',
        value: buyers.filter((b: any) => b.status === 'Hot Lead').length.toString(),
        icon: Flame,
        color: 'bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300',
        change: '+3 this week',
      },
      {
        id: 'follow-up-leads',
        title: 'Follow-up Leads',
        value: followUps.length.toString(),
        icon: PhoneForwarded,
        color: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300',
        change: `${followUps.filter((f: any) => new Date(f.nextReminder) <= now).length} due`,
      },
       {
        id: 'appointments-month',
        title: 'Appointments (Month)',
        value: appointmentsLastMonth.length.toString(),
        icon: CalendarDays,
        color: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-300',
        change: `${appointments.filter((a: any) => a.status === 'Scheduled').length} upcoming`,
      },
       {
        id: 'completed-month',
        title: 'Completed (Month)',
        value: completedLastMonth.toString(),
        icon: CheckCheck,
        color: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',
        change: 'Keep it up!',
      },
        {
        id: 'cancelled-month',
        title: 'Cancelled (Month)',
        value: cancelledLastMonth.toString(),
        icon: XCircle,
        color: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300',
        change: 'Review reasons',
      },
    ];

    setKpiData(updatedKpiData);

  }, [currency]);
  
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
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <PerformanceChart properties={properties} />
      </div>
    </div>
  );
}
