
'use client';

import { useMemo } from 'react';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where } from 'firebase/firestore';
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
  const isAgent = profile.role === 'Agent';

  // --- Data Fetching ---
  const propertiesQuery = useMemoFirebase(() => {
    if (!canFetch) return null;
    if (isAgent) {
        return query(collection(firestore, 'agencies', profile.agency_id, 'properties'), where('created_by', '==', profile.user_id));
    }
    return collection(firestore, 'agencies', profile.agency_id, 'properties');
  }, [canFetch, firestore, profile.agency_id, isAgent, profile.user_id]);
  const { data: myProperties, isLoading: isPropertiesLoading } = useCollection<Property>(propertiesQuery);
  
  const assignedPropertiesQuery = useMemoFirebase(() => {
    if (!canFetch || !isAgent) return null;
    return query(collection(firestore, 'agencies', profile.agency_id, 'properties'), where('assignedTo', '==', profile.user_id));
  }, [canFetch, firestore, profile.agency_id, isAgent, profile.user_id]);
  const { data: assignedProperties } = useCollection<Property>(assignedPropertiesQuery);

  const buyersQuery = useMemoFirebase(() => {
    if (!canFetch) return null;
    if (isAgent) {
        return query(collection(firestore, 'agencies', profile.agency_id, 'buyers'), where('created_by', '==', profile.user_id));
    }
    return collection(firestore, 'agencies', profile.agency_id, 'buyers');
  }, [canFetch, firestore, profile.agency_id, isAgent, profile.user_id]);
  const { data: myBuyers, isLoading: isBuyersLoading } = useCollection<Buyer>(buyersQuery);
  
  const assignedBuyersQuery = useMemoFirebase(() => {
    if (!canFetch || !isAgent) return null;
    return query(collection(firestore, 'agencies', profile.agency_id, 'buyers'), where('assignedTo', '==', profile.user_id));
  }, [canFetch, firestore, profile.agency_id, isAgent, profile.user_id]);
  const { data: assignedBuyers } = useCollection<Buyer>(assignedBuyersQuery);

  // Agent's data is their own + assigned, Admin's is all.
  const finalProperties = useMemo(() => isAgent ? [...(myProperties || []), ...(assignedProperties || [])] : myProperties, [isAgent, myProperties, assignedProperties]);
  const finalBuyers = useMemo(() => isAgent ? [...(myBuyers || []), ...(assignedBuyers || [])] : myBuyers, [isAgent, myBuyers, assignedBuyers]);

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
          <PerformanceChart properties={finalProperties || []} />
          <LeadsChart properties={finalProperties || []} buyers={finalBuyers || []} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SalesBreakdownChart properties={finalProperties || []} />
            <BuyerBreakdownChart buyers={finalBuyers || []} properties={finalProperties || []} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
             <PropertyTypesChart properties={finalProperties || []} />
          </div>
      </div>

    </div>
  );
}
