'use client';
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, UserPlus, DollarSign, Home, UserCheck, ArrowUpRight, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfile } from '@/context/profile-context';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/hooks';
import { collection, query, where } from 'firebase/firestore';
import type { Property, Buyer, User } from '@/lib/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { subDays, isWithinInterval, parseISO } from 'date-fns';

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
    
    const teamMembersQuery = useMemoFirebase(() => canFetch ? collection(firestore, 'agencies', profile.agency_id, 'teamMembers') : null, [canFetch, firestore, profile.agency_id]);
    const { data: teamMembers, isLoading: isTeamLoading } = useCollection<User>(teamMembersQuery);

    const isLoading = isProfileLoading || isPropertiesLoading || isBuyersLoading || isTeamLoading;

    // --- Memoized Stats ---
    const stats = useMemo(() => {
        const filterLast30Days = (item: { created_at?: string; sale_date?: string; createdAt?: any; status?: string }) => {
            const dateString = item.sale_date || item.created_at || (item.createdAt?.toDate ? item.createdAt.toDate().toISOString() : null);
            if (!dateString) return false;
            return isWithinInterval(parseISO(dateString), { start: last30DaysStart, end: now });
        };
        
        const totalProperties = properties?.filter(p => !p.is_deleted).length || 0;
        const totalBuyers = buyers?.filter(b => !b.is_deleted).length || 0;
        const totalAgents = teamMembers?.filter(m => m.status === 'Active').length || 0;
        
        const agentsAdded30d = teamMembers?.filter(m => m.status === 'Active' && filterLast30Days(m)).length || 0;
        const propertiesSold30d = properties?.filter(p => p.status === 'Sold' && filterLast30Days(p)).length || 0;
        const propertiesAdded30d = properties?.filter(filterLast30Days).length || 0;
        const buyersAdded30d = buyers?.filter(filterLast30Days).length || 0;

        return {
            totalProperties,
            totalBuyers,
            totalAgents,
            agentsAdded30d,
            propertiesSold30d,
            propertiesAdded30d,
            buyersAdded30d
        };
    }, [properties, buyers, teamMembers, last30DaysStart, now]);

    const statCardsData: StatCardProps[] = [
        {
            title: "Total Properties",
            value: stats.totalProperties,
            change: `+${stats.propertiesAdded30d} in last 30 days`,
            icon: <Home className="h-4 w-4" />,
            color: "bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300",
            href: "/properties",
            isLoading
        },
        {
            title: "Total Buyers",
            value: stats.totalBuyers,
            change: `+${stats.buyersAdded30d} in last 30 days`,
            icon: <Users className="h-4 w-4" />,
            color: "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300",
            href: "/buyers",
            isLoading
        },
        {
            title: "Properties Sold (30d)",
            value: stats.propertiesSold30d,
            change: "From all properties",
            icon: <DollarSign className="h-4 w-4" />,
            color: "bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300",
            href: "/properties?status=Sold",
            isLoading
        },
        {
            title: "New Properties (30d)",
            value: stats.propertiesAdded30d,
            change: "Added in the last month",
            icon: <ArrowUpRight className="h-4 w-4" />,
            color: "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300",
            href: "/properties",
            isLoading
        },
        {
            title: "New Buyers (30d)",
            value: stats.buyersAdded30d,
            change: "Leads generated this month",
            icon: <UserCheck className="h-4 w-4" />,
            color: "bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300",
            href: "/buyers",
            isLoading
        },
    ];
    
    // Add agents card only for Admins
    if(profile.role === 'Admin') {
        statCardsData.splice(2, 0, {
            title: "Total Agents",
            value: stats.totalAgents,
            change: `+${stats.agentsAdded30d} in last 30 days`,
            icon: <UserPlus className="h-4 w-4" />,
            color: "bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300",
            href: "/team",
            isLoading
        });
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3"><TrendingUp/> Statistics</h1>
                <p className="text-muted-foreground">A quick overview of your performance and key metrics in the last 30 days.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {statCardsData.map(card => <StatCard key={card.title} {...card} />)}
            </div>
        </div>
    );
}
