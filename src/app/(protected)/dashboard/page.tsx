
'use client';
import React, { useState, useEffect, useMemo } from 'react';
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
  Briefcase,
  Home,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { subDays, isWithinInterval, parseISO } from 'date-fns';
import { useCurrency } from '@/context/currency-context';
import { formatCurrency, formatUnit } from '@/lib/formatters';
import { PerformanceChart } from '@/components/performance-chart';
import { Property, Buyer, Appointment, FollowUp, User, PriceUnit } from '@/lib/types';
import { AnalyticsChart } from '@/components/analytics-chart';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/hooks';
import { useProfile } from '@/context/profile-context';
import { Skeleton } from '@/components/ui/skeleton';

type KpiData = {
  id: string;
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  change: string;
};


const calculateKpis = (
    properties: Property[] | null,
    buyers: Buyer[] | null,
    appointments: Appointment[] | null,
    followUps: FollowUp[] | null,
    currency: string
): KpiData[] => {
    const now = new Date();
    const last30Days = subDays(now, 30);
    
    const getChange = (current: number, previous: number) => {
        if (previous === 0) {
            return current > 0 ? `+${current}` : 'No change';
        }
        const change = current - previous;
        if (change === 0) {
            return 'No change';
        }
        const percentageChange = (change / previous) * 100;
        return `${percentageChange > 0 ? '+' : ''}${percentageChange.toFixed(0)}%`;
    }
    
    const safeProperties = properties || [];
    const safeBuyers = buyers || [];
    const safeAppointments = appointments || [];
    const safeFollowUps = followUps || [];

    const propertiesInLast30Days = safeProperties.filter(p => p.created_at && isWithinInterval(parseISO(p.created_at), { start: last30Days, end: now })).length;
    const previousPropertiesCount = safeProperties.length - propertiesInLast30Days;
    
    const buyersInLast30Days = safeBuyers.filter(b => b.created_at && isWithinInterval(parseISO(b.created_at), { start: last30Days, end: now })).length;
    const previousBuyersCount = safeBuyers.length - buyersInLast30Days;
    
    const soldInLast30Days = safeProperties.filter(p => p.status === 'Sold' && p.sold_at && isWithinInterval(parseISO(p.sold_at), { start: last30Days, end: now }));
    const totalSoldCount = safeProperties.filter(p => p.status === 'Sold').length;
    const previousSoldCount = totalSoldCount - soldInLast30Days.length;
    
    const revenueInLast30Days = soldInLast30Days.reduce((acc, p) => acc + (p.sold_price || 0), 0);
    const totalRevenue = safeProperties.filter(p => p.status === 'Sold' && p.sold_price).reduce((acc, p) => acc + (p.sold_price || 0), 0);
    const previousRevenue = totalRevenue - revenueInLast30Days;

    return [
       {
        id: 'total-properties',
        title: 'Total Properties',
        value: safeProperties.length.toString(),
        icon: Building2,
        color: 'bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300',
        change: getChange(propertiesInLast30Days, previousPropertiesCount),
      },
      {
        id: 'total-buyers',
        title: 'Total Buyers',
        value: safeBuyers.length.toString(),
        icon: Users,
        color: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300',
        change: getChange(buyersInLast30Days, previousBuyersCount),
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
        value: formatCurrency(revenueInLast30Days, currency as any, { notation: 'compact' }),
        icon: DollarSign,
        color: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',
        change: getChange(revenueInLast30Days, previousRevenue),
      },
       {
        id: 'interested-buyers',
        title: 'Interested Buyers',
        value: safeBuyers.filter((b: any) => b.status === 'Interested').length.toString(),
        icon: Star,
        color: 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300',
        change: `${safeBuyers.filter(b => b.status === 'Interested' && b.created_at && isWithinInterval(parseISO(b.created_at), { start: last30Days, end: now })).length} new`,
      },
      {
        id: 'follow-up-leads',
        title: 'Follow-up Leads',
        value: safeFollowUps.length.toString(),
        icon: PhoneForwarded,
        color: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300',
        change: `${safeFollowUps.filter((f: any) => new Date(f.nextReminder) <= now).length} due`,
      },
       {
        id: 'appointments-month',
        title: 'Appointments (30d)',
        value: safeAppointments.filter((a: any) => a.date && isWithinInterval(parseISO(a.date), { start: last30Days, end: now })).length.toString(),
        icon: CalendarDays,
        color: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-300',
        change: `${safeAppointments.filter((a: any) => a.status === 'Scheduled' && a.date && new Date(a.date) >= now).length} upcoming`,
      },
       {
        id: 'completed-month',
        title: 'Completed (30d)',
        value: safeAppointments.filter((a: any) => a.status === 'Completed' && a.date && isWithinInterval(parseISO(a.date), { start: last30Days, end: now })).length.toString(),
        icon: CheckCheck,
        color: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',
        change: 'Keep it up!',
      },
        {
        id: 'cancelled-month',
        title: 'Cancelled (30d)',
        value: safeAppointments.filter((a: any) => a.status === 'Cancelled' && a.date && isWithinInterval(parseISO(a.date), { start: last30Days, end: now })).length.toString(),
        icon: XCircle,
        color: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300',
        change: 'Review reasons',
      },
    ];
};

const KpiGrid = ({ kpiData, isLoading }: { kpiData: KpiData[], isLoading: boolean }) => {
    const dataToShow = (isLoading || kpiData.length === 0) ? Array(9).fill({}) : kpiData;
    
    return (
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {dataToShow.map((kpi, i) => (
                isLoading ? 
                <Skeleton key={i} className="h-[108px]" /> :
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
    )
};


export default function DashboardPage() {
  const { currency } = useCurrency();
  const firestore = useFirestore();
  const { profile } = useProfile();
  
  // Agency-wide data
  const agencyPropertiesQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'properties') : null, [profile.agency_id, firestore]);
  const agencyBuyersQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'buyers') : null, [profile.agency_id, firestore]);
  const agencyAppointmentsQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'appointments') : null, [profile.agency_id, firestore]);
  const agencyFollowUpsQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'followUps') : null, [profile.agency_id, firestore]);
  
  const { data: agencyProperties, isLoading: apLoading } = useCollection<Property>(agencyPropertiesQuery);
  const { data: agencyBuyers, isLoading: abLoading } = useCollection<Buyer>(agencyBuyersQuery);
  const { data: agencyAppointments, isLoading: aaLoading } = useCollection<Appointment>(agencyAppointmentsQuery);
  const { data: agencyFollowUps, isLoading: afLoading } = useCollection<FollowUp>(agencyFollowUpsQuery);

  // Agent-specific data
  const agentPropertiesQuery = useMemoFirebase(() => (profile.role === 'Agent' && profile.user_id) ? collection(firestore, 'agents', profile.user_id, 'properties') : null, [profile.role, profile.user_id, firestore]);
  const { data: agentProperties, isLoading: agentPLoading } = useCollection<Property>(agentPropertiesQuery);
  
  const agentBuyersQuery = useMemoFirebase(() => (profile.role === 'Agent' && profile.user_id) ? collection(firestore, 'agents', profile.user_id, 'buyers') : null, [profile.role, profile.user_id, firestore]);
  const { data: agentBuyers, isLoading: agentBLoading } = useCollection<Buyer>(agentBuyersQuery);


  const isAgencyDataLoading = apLoading || abLoading || aaLoading || afLoading;
  const isAgentDataLoading = agentPLoading || agentBLoading || aaLoading || afLoading;

  const agencyKpiData = useMemo(() => calculateKpis(agencyProperties, agencyBuyers, agencyAppointments, agencyFollowUps, currency), [agencyProperties, agencyBuyers, agencyAppointments, agencyFollowUps, currency]);
  
  const agentKpiData = useMemo(() => {
    if (profile.role !== 'Agent' || !profile.name) return [];
    
    // Filter agency-level data for the current agent
    const agentSpecificAppointments = agencyAppointments?.filter(a => a.agentName === profile.name) || null;
    const agentSpecificFollowUps = agencyFollowUps?.filter(f => f.buyerId && (agentBuyers?.some(b => b.id === f.buyerId))) || null; // Simplified logic
    const agentSpecificProperties = agencyProperties?.filter(p => p.created_by === profile.user_id) || [];
    const allAgentProperties = [...(agentProperties || []), ...agentSpecificProperties];
    
    return calculateKpis(allAgentProperties, agentBuyers, agentSpecificAppointments, agentSpecificFollowUps, currency);
  }, [agentProperties, agentBuyers, agencyAppointments, agencyFollowUps, agencyProperties, currency, profile.role, profile.name, profile.user_id]);


  return (
    <div className="flex flex-col gap-8">
        {profile.role === 'Agent' && (
             <div className='space-y-4'>
                <h2 className="text-2xl font-bold tracking-tight font-headline flex items-center gap-2"><Briefcase /> My Stats</h2>
                <KpiGrid kpiData={agentKpiData} isLoading={isAgentDataLoading} />
             </div>
        )}

        <div className='space-y-4'>
            <h2 className="text-2xl font-bold tracking-tight font-headline flex items-center gap-2"><Home /> Agency Stats</h2>
            <KpiGrid kpiData={agencyKpiData} isLoading={isAgencyDataLoading} />
        </div>

      <div className="grid grid-cols-1 gap-8">
        <PerformanceChart properties={agencyProperties || []} />
        <AnalyticsChart buyers={agencyBuyers || []} />
      </div>
    </div>
  );
}
