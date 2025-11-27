'use client';
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, UserPlus, DollarSign, Home, UserCheck, ArrowUpRight, TrendingUp, Star, PhoneForwarded, CalendarDays, CheckCheck, XCircle, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfile } from '@/context/profile-context';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/hooks';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import type { Property, Buyer, Appointment, FollowUp, User, PriceUnit } from '@/lib/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { subDays, isWithinInterval, parseISO } from 'date-fns';
import { useCurrency } from '@/context/currency-context';
import { formatCurrency, formatUnit } from '@/lib/formatters';
import { PerformanceChart } from '@/components/performance-chart';

interface StatCardProps {
    title: string;
    value: number | string;
    change: string;
    icon: React.ReactNode;
    color: string;
    href: string;
    isLoading: boolean;
}

const StatCard = ({ title, value, change, icon, color, href, isLoading }: StatCardProps) => {
    if (isLoading) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium"><Skeleton className="h-4 w-24" /></CardTitle>
                    <Skeleton className="h-8 w-8 rounded-full" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-3 w-20 mt-1" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Link href={href}>
            <Card className="hover:shadow-lg hover:-translate-y-1 transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <div className={cn("flex items-center justify-center rounded-full h-8 w-8", color)}>
                        {icon}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{value}</div>
                    <p className="text-xs text-muted-foreground">{change}</p>
                </CardContent>
            </Card>
        </Link>
    );
};


export default function OverviewPage() {
    const { profile, isLoading: isProfileLoading } = useProfile();
    const firestore = useFirestore();
    const { currency } = useCurrency();

    const canFetch = !isProfileLoading && profile.agency_id;
    const now = new Date();
    const last30DaysStart = subDays(now, 30);

    // --- Data Fetching ---
    const propertiesQuery = useMemoFirebase(() => {
        if (!canFetch) return null;
        if (profile.role === 'Agent') {
            return query(collection(firestore, 'agencies', profile.agency_id, 'properties'), where('created_by', '==', profile.user_id));
        }
        return collection(firestore, 'agencies', profile.agency_id, 'properties');
    }, [canFetch, firestore, profile.agency_id, profile.role, profile.user_id]);
    const { data: properties, isLoading: isPropertiesLoading } = useCollection<Property>(propertiesQuery);
    
    const buyersQuery = useMemoFirebase(() => {
        if (!canFetch) return null;
        if (profile.role === 'Agent') {
            return query(collection(firestore, 'agencies', profile.agency_id, 'buyers'), where('created_by', '==', profile.user_id));
        }
        return collection(firestore, 'agencies', profile.agency_id, 'buyers');
    }, [canFetch, firestore, profile.agency_id, profile.role, profile.user_id]);
    const { data: buyers, isLoading: isBuyersLoading } = useCollection<Buyer>(buyersQuery);
    
    const followUpsQuery = useMemoFirebase(() => canFetch ? collection(firestore, 'agencies', profile.agency_id, 'followUps') : null, [canFetch, firestore, profile.agency_id]);
    const { data: followUps, isLoading: isFollowUpsLoading } = useCollection<FollowUp>(followUpsQuery);
    
    const appointmentsQuery = useMemoFirebase(() => canFetch ? collection(firestore, 'agencies', profile.agency_id, 'appointments') : null, [canFetch, firestore, profile.agency_id]);
    const { data: appointments, isLoading: isAppointmentsLoading } = useCollection<Appointment>(appointmentsQuery);
    
    const teamMembersQuery = useMemoFirebase(() => canFetch && profile.role === 'Admin' ? collection(firestore, 'agencies', profile.agency_id, 'teamMembers') : null, [canFetch, firestore, profile.agency_id, profile.role]);
    const { data: teamMembers, isLoading: isTeamMembersLoading } = useCollection<User>(teamMembersQuery);

    const isLoading = isProfileLoading || isPropertiesLoading || isBuyersLoading || isFollowUpsLoading || isAppointmentsLoading || isTeamMembersLoading;

    // --- Memoized Stats ---
    const stats = useMemo(() => {
        const filterLast30Days = (item: { created_at?: string; sale_date?: string; invitedAt?: any; date?: string; status?: string }) => {
            const dateString = item.sale_date || item.created_at || item.date || (item.invitedAt instanceof Timestamp ? item.invitedAt.toDate().toISOString() : item.invitedAt);
            if (!dateString) return false;
            return isWithinInterval(parseISO(dateString), { start: last30DaysStart, end: now });
        };
        
        const totalProperties = properties?.filter(p => !p.is_deleted).length || 0;
        const totalBuyers = buyers?.filter(b => !b.is_deleted).length || 0;
        
        const soldInLast30Days = properties?.filter(p => p.status === 'Sold' && p.sale_date && filterLast30Days(p)) || [];
        const revenue30d = soldInLast30Days.reduce((sum, prop) => sum + (prop.total_commission || 0), 0);

        const propertiesForRent = properties?.filter(p => p.status === 'Available' && p.potential_rent_amount && p.potential_rent_amount > 0).length || 0;

        const interestedBuyers = buyers?.filter(b => b.status === 'Interested' && !b.is_deleted).length || 0;
        const followUpLeads = followUps?.length || 0;

        const appointments30d = appointments?.filter(filterLast30Days).length || 0;
        const completedAppointments30d = appointments?.filter(a => a.status === 'Completed' && filterLast30Days(a)).length || 0;
        const cancelledAppointments30d = appointments?.filter(a => a.status === 'Cancelled' && filterLast30Days(a)).length || 0;
        const upcomingAppointments = appointments?.filter(a => a.status === 'Scheduled' && new Date(a.date) >= now).length || 0;
        
        const newProperties30d = properties?.filter(filterLast30Days).length || 0;
        const newBuyers30d = buyers?.filter(filterLast30Days).length || 0;
        const newAgents30d = teamMembers?.filter(m => m.status === 'Active' && filterLast30Days(m)).length || 0;


        return {
            totalProperties,
            totalBuyers,
            revenue30d,
            propertiesForRent,
            interestedBuyers,
            followUpLeads,
            appointments30d,
            completedAppointments30d,
            cancelledAppointments30d,
            upcomingAppointments,
            soldInLast30DaysCount: soldInLast30Days.length,
            newProperties30d,
            newBuyers30d,
            newAgents30d,
            totalTeamMembers: teamMembers?.filter(m => m.status === 'Active').length || 0,
        };
    }, [properties, buyers, followUps, appointments, teamMembers, last30DaysStart, now]);

    const statCardsData: StatCardProps[] = [
        {
            title: "Total Properties",
            value: stats.totalProperties,
            change: `+${stats.newProperties30d} in last 30 days`,
            icon: <Home className="h-4 w-4" />,
            color: "bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300",
            href: "/properties",
            isLoading
        },
        {
            title: "Total Buyers",
            value: stats.totalBuyers,
            change: `+${stats.newBuyers30d} in last 30 days`,
            icon: <Users className="h-4 w-4" />,
            color: "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300",
            href: "/buyers",
            isLoading
        },
        {
            title: "Revenue (30d)",
            value: formatCurrency(stats.revenue30d, currency, { notation: 'compact' }),
            change: `From ${stats.soldInLast30DaysCount} sales`,
            icon: <DollarSign className="h-4 w-4" />,
            color: "bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300",
            href: "/properties?status=Sold",
            isLoading
        },
        {
            title: "Properties Sold (30d)",
            value: stats.soldInLast30DaysCount,
            change: "Closed deals this month",
            icon: <CheckCircle className="h-4 w-4" />,
            color: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300",
            href: "/properties?status=Sold",
            isLoading,
        },
        {
            title: "For Rent Properties",
            value: stats.propertiesForRent,
            change: "Currently available for rent",
            icon: <Building2 className="h-4 w-4" />,
            color: "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300",
            href: "/properties?status=For Rent",
            isLoading
        },
        {
            title: "Interested Buyers",
            value: stats.interestedBuyers,
            change: `+${buyers?.filter(b => b.status === 'Interested' && filterLast30Days(b)).length || 0} new leads this month`,
            icon: <Star className="h-4 w-4" />,
            color: "bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300",
            href: "/buyers?status=Interested",
            isLoading
        },
        {
            title: "Follow-up Leads",
            value: stats.followUpLeads,
            change: "Leads requiring action",
            icon: <PhoneForwarded className="h-4 w-4" />,
            color: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300",
            href: "/follow-ups",
            isLoading
        },
        {
            title: "Appointments (30d)",
            value: stats.appointments30d,
            change: `${stats.upcomingAppointments} upcoming`,
            icon: <CalendarDays className="h-4 w-4" />,
            color: "bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-300",
            href: "/appointments",
            isLoading
        },
         {
            title: "Completed (30d)",
            value: stats.completedAppointments30d,
            change: "Completed appointments",
            icon: <CheckCheck className="h-4 w-4" />,
            color: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300",
            href: "/appointments",
            isLoading
        },
        {
            title: "Cancelled (30d)",
            value: stats.cancelledAppointments30d,
            change: "Cancelled appointments",
            icon: <XCircle className="h-4 w-4" />,
            color: "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300",
            href: "/appointments",
            isLoading
        },
    ];

    const adminCards: StatCardProps[] = [
        {
            title: "Total Agents",
            value: stats.totalTeamMembers,
            change: `+${stats.newAgents30d} in last 30 days`,
            icon: <UserCheck className="h-4 w-4" />,
            color: "bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-300",
            href: "/team",
            isLoading,
        },
    ];
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3"><TrendingUp/> Statistics</h1>
                <p className="text-muted-foreground">A quick overview of your performance and key metrics in the last 30 days.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {statCardsData.map(card => <StatCard key={card.title} {...card} />)}
                {profile.role === 'Admin' && adminCards.map(card => <StatCard key={card.title} {...card} />)}
            </div>
            
            <div className="grid grid-cols-1 gap-8 pt-8">
                <PerformanceChart properties={properties || []} />
            </div>

        </div>
    );
}
