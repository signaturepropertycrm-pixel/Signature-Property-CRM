
'use client';
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, UserPlus, DollarSign, Home, UserCheck, ArrowRight, ArrowUpRight, TrendingUp, Star, PhoneForwarded, CalendarDays, CheckCheck, XCircle, CheckCircle, Briefcase, Gem, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfile } from '@/context/profile-context';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/hooks';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import type { Property, Buyer, Appointment, FollowUp, User, PriceUnit } from '@/lib/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { subDays, isWithinInterval, parseISO, format } from 'date-fns';
import { useCurrency } from '@/context/currency-context';
import { formatCurrency, formatUnit } from '@/lib/formatters';
import { PerformanceChart } from '@/components/performance-chart';
import { LeadsChart } from '@/components/leads-chart';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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

    const filterLast30Days = (item: { created_at?: string; sale_date?: string; rent_out_date?: string, invitedAt?: any; date?: string; status?: string }) => {
        const dateString = item.rent_out_date || item.sale_date || item.created_at || item.date || (item.invitedAt instanceof Timestamp ? item.invitedAt.toDate().toISOString() : item.invitedAt);
        if (!dateString) return false;
        return isWithinInterval(parseISO(dateString), { start: last30DaysStart, end: now });
    };

    // --- Memoized Stats ---
    const stats = useMemo(() => {
        const totalProperties = properties?.filter(p => !p.is_deleted && !p.is_for_rent).length || 0;
        const totalSaleBuyers = buyers?.filter(b => !b.is_deleted && (!b.listing_type || b.listing_type === 'For Sale')).length || 0;
        const totalRentBuyers = buyers?.filter(b => !b.is_deleted && b.listing_type === 'For Rent').length || 0;
        
        const soldInLast30Days = properties?.filter(p => p.status === 'Sold' && p.sale_date && filterLast30Days(p)) || [];
        const revenue30d = soldInLast30Days.reduce((sum, prop) => sum + (prop.total_commission || 0), 0);
        
        const rentOutInLast30Days = properties?.filter(p => p.status === 'Rent Out' && p.rent_out_date && filterLast30Days(p)) || [];
        const rentRevenue30d = rentOutInLast30Days.reduce((sum, prop) => sum + (prop.rent_total_commission || 0), 0);


        const propertiesForRent = properties?.filter(p => p.status === 'Available' && p.is_for_rent).length || 0;

        const interestedBuyers = buyers?.filter(b => b.status === 'Interested' && !b.is_deleted).length || 0;
        const followUpLeads = followUps?.length || 0;

        const appointments30d = appointments?.filter(filterLast30Days).length || 0;
        const completedAppointments30d = appointments?.filter(a => a.status === 'Completed' && filterLast30Days(a)).length || 0;
        const cancelledAppointments30d = appointments?.filter(a => a.status === 'Cancelled' && filterLast30Days(a)).length || 0;
        const upcomingAppointments = appointments?.filter(a => a.status === 'Scheduled' && new Date(a.date) >= now).length || 0;
        
        const newProperties30d = properties?.filter(p => !p.is_for_rent && filterLast30Days(p)).length || 0;
        const newBuyers30d = buyers?.filter(b => b.listing_type === 'For Sale' && filterLast30Days(b)).length || 0;
        const newRentBuyers30d = buyers?.filter(b => b.listing_type === 'For Rent' && filterLast30Days(b)).length || 0;


        return {
            totalProperties,
            totalSaleBuyers,
            totalRentBuyers,
            revenue30d,
            rentRevenue30d,
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
            newRentBuyers30d
        };
    }, [properties, buyers, followUps, appointments, teamMembers, last30DaysStart, now]);

    const statCardsData: StatCardProps[] = [
        {
            title: "Sale Properties",
            value: stats.totalProperties,
            change: `+${stats.newProperties30d} in last 30 days`,
            icon: <Home className="h-4 w-4" />,
            color: "bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300",
            href: "/properties?status=All (Sale)",
            isLoading
        },
        {
            title: "Sale Buyers",
            value: stats.totalSaleBuyers,
            change: `+${stats.newBuyers30d} in last 30 days`,
            icon: <Users className="h-4 w-4" />,
            color: "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300",
            href: "/buyers?type=For+Sale",
            isLoading
        },
        {
            title: "Rent Properties",
            value: stats.propertiesForRent,
            change: "Currently available",
            icon: <Building2 className="h-4 w-4" />,
            color: "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300",
            href: "/properties?status=Available (Rent)",
            isLoading
        },
        {
            title: "Rent Buyers",
            value: stats.totalRentBuyers,
            change: `+${stats.newRentBuyers30d} new in 30 days`,
            icon: <Briefcase className="h-4 w-4" />,
            color: "bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-300",
            href: "/buyers?type=For+Rent",
            isLoading
        },
        {
            title: "Sale Revenue (30d)",
            value: formatCurrency(stats.revenue30d, currency, { notation: 'compact' }),
            change: `From ${stats.soldInLast30DaysCount} sales`,
            icon: <DollarSign className="h-4 w-4" />,
            color: "bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300",
            href: "/properties?status=Sold",
            isLoading
        },
        {
            title: "Rent Revenue (30d)",
            value: formatCurrency(stats.rentRevenue30d, currency, { notation: 'compact' }),
            change: "From new rentals",
            icon: <DollarSign className="h-4 w-4" />,
            color: "bg-lime-100 dark:bg-lime-900 text-lime-600 dark:text-lime-300",
            href: "/properties?status=Rent Out",
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
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3"><TrendingUp/> Statistics</h1>
                <p className="text-muted-foreground">A quick overview of your performance and key metrics in the last 30 days.</p>
            </div>
            
            {profile.role === 'Admin' && profile.trialEndDate && profile.daysLeftInTrial !== undefined && profile.daysLeftInTrial > 0 && (
                 <Alert className="max-w-2xl mx-auto bg-primary/10 border-primary/30">
                    <Info className="h-4 w-4" />
                    <AlertTitle className="font-bold">
                        {profile.daysLeftInTrial > 1 ? `${profile.daysLeftInTrial} Days Left in Your Trial` : 'Your trial ends today!'}
                    </AlertTitle>
                    <AlertDescription>
                        Your 30-day free trial of the Standard plan ends on {format(new Date(profile.trialEndDate), 'PPP')}.
                        <Link href="/upgrade" className="font-semibold text-primary underline ml-2">Upgrade now</Link> to keep your premium features.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {statCardsData.map(card => <StatCard key={card.title} {...card} />)}
            </div>
            
            <div className="grid grid-cols-1 gap-8 pt-8">
                <PerformanceChart properties={properties || []} />
                <LeadsChart properties={properties || []} buyers={buyers || []} />
            </div>

            <Card className="mt-12 bg-gradient-to-r from-primary/90 to-blue-500/90 text-primary-foreground shadow-2xl">
                <div className="flex flex-col md:flex-row items-center justify-between p-8 gap-6">
                    <div className="flex-shrink-0">
                        <Gem className="w-16 h-16 opacity-80" />
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-bold font-headline">Unlock Your Agency's Full Potential</h2>
                        <p className="mt-2 max-w-2xl opacity-90">Upgrade to the Standard plan to access powerful tools, manage more leads, and collaborate with a larger team. Boost your productivity today!</p>
                    </div>
                    <div className="flex-shrink-0">
                        <Button asChild size="lg" className="bg-background text-primary hover:bg-background/90 font-bold text-lg px-8 py-6 rounded-full shadow-lg transition-transform hover:scale-105">
                            <Link href="/upgrade">
                                Upgrade Now <ArrowRight className="ml-2" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </Card>

        </div>
    );
}
