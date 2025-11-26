
'use client';
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfile } from '@/context/profile-context';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/hooks';
import { collection, query, where } from 'firebase/firestore';
import type { Property, Buyer } from '@/lib/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    href: string;
    isLoading: boolean;
}

const StatCard = ({ title, value, icon, color, href, isLoading }: StatCardProps) => {
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
                    <p className="text-xs text-muted-foreground">View all</p>
                </CardContent>
            </Card>
        </Link>
    );
};


export default function OverviewPage() {
    const { profile, isLoading: isProfileLoading } = useProfile();
    const firestore = useFirestore();

    const canFetch = !isProfileLoading && profile.agency_id;

    // --- Data Fetching ---
    // Properties
    const propertiesQuery = useMemoFirebase(() => {
        if (!canFetch) return null;
        if (profile.role === 'Agent') {
            return query(collection(firestore, 'agencies', profile.agency_id, 'properties'), where('created_by', '==', profile.user_id));
        }
        return collection(firestore, 'agencies', profile.agency_id, 'properties');
    }, [canFetch, firestore, profile.agency_id, profile.role, profile.user_id]);
    const { data: properties, isLoading: isPropertiesLoading } = useCollection<Property>(propertiesQuery);
    
    // Buyers
    const buyersQuery = useMemoFirebase(() => {
        if (!canFetch) return null;
        if (profile.role === 'Agent') {
            return query(collection(firestore, 'agencies', profile.agency_id, 'buyers'), where('created_by', '==', profile.user_id));
        }
        return collection(firestore, 'agencies', profile.agency_id, 'buyers');
    }, [canFetch, firestore, profile.agency_id, profile.role, profile.user_id]);
    const { data: buyers, isLoading: isBuyersLoading } = useCollection<Buyer>(buyersQuery);
    
    const isLoading = isProfileLoading || isPropertiesLoading || isBuyersLoading;

    // --- Memoized Counts ---
    const totalProperties = useMemo(() => properties?.filter(p => !p.is_deleted).length || 0, [properties]);
    const totalBuyers = useMemo(() => buyers?.filter(b => !b.is_deleted).length || 0, [buyers]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">Statistics</h1>
                <p className="text-muted-foreground">A quick overview of your performance and key metrics.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Properties"
                    value={totalProperties}
                    icon={<Building2 className="h-4 w-4" />}
                    color="bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300"
                    href="/properties"
                    isLoading={isLoading}
                />
                <StatCard
                    title="Total Buyers"
                    value={totalBuyers}
                    icon={<Users className="h-4 w-4" />}
                    color="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300"
                    href="/buyers"
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
}
