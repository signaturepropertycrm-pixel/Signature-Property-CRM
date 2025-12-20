
'use client';

import { useMemo } from 'react';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection } from 'firebase/firestore';
import { useProfile } from '@/context/profile-context';
import { useMemoFirebase } from '@/firebase/hooks';
import { Property, Buyer } from '@/lib/types';
import { PerformanceChart } from '@/components/performance-chart';
import { LeadsChart } from '@/components/leads-chart';
import { SalesBreakdownChart } from '@/components/sales-breakdown-chart';
import { PropertyTypesChart } from '@/components/property-types-chart';
import { BuyerBreakdownChart } from '@/components/buyer-breakdown-chart';
import { PieChart } from 'lucide-react';


export default function AnalyticsPage() {
  const { profile, isLoading: isProfileLoading } = useProfile();
  const firestore = useFirestore();

  const canFetch = !isProfileLoading && profile.agency_id;

  const propertiesQuery = useMemoFirebase(() => 
    canFetch ? collection(firestore, 'agencies', profile.agency_id, 'properties') : null, 
    [canFetch, firestore, profile.agency_id]
  );
  const { data: properties, isLoading: isPropertiesLoading } = useCollection<Property>(propertiesQuery);
  
  const buyersQuery = useMemoFirebase(() => 
    canFetch ? collection(firestore, 'agencies', profile.agency_id, 'buyers') : null, 
    [canFetch, firestore, profile.agency_id]
  );
  const { data: buyers, isLoading: isBuyersLoading } = useCollection<Buyer>(buyersQuery);
  
  const isLoading = isPropertiesLoading || isBuyersLoading;

  if (isLoading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            <PieChart />
            Analytics
        </h1>
        <p className="text-muted-foreground">
          Visual charts to analyze your agency's performance over time.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 pt-8">
          <PerformanceChart properties={properties || []} />
          <LeadsChart properties={properties || []} buyers={buyers || []} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SalesBreakdownChart properties={properties || []} />
            <BuyerBreakdownChart buyers={buyers || []} properties={properties || []} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
             <PropertyTypesChart properties={properties || []} />
          </div>
      </div>

    </div>
  );
}
