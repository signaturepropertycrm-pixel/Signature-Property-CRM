
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Property } from '@/lib/types';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection } from 'firebase/firestore';
import { useProfile } from '@/context/profile-context';
import { useMemoFirebase } from '@/firebase/hooks';
import { formatCurrency } from '@/lib/formatters';
import { useCurrency } from '@/context/currency-context';
import { LineChart } from 'lucide-react';

export default function AnalyticsPage() {
  const { profile } = useProfile();
  const firestore = useFirestore();
  const { currency } = useCurrency();

  const propertiesQuery = useMemoFirebase(
    () => (profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'properties') : null),
    [profile.agency_id, firestore]
  );
  const { data: properties, isLoading } = useCollection<Property>(propertiesQuery);

  const salesReportData = useMemo(() => {
    if (!properties) return { rows: [], totals: { soldPrice: 0, totalCommission: 0, agentShare: 0, agencyProfit: 0 } };
    const soldProperties = properties.filter(p => p.status === 'Sold' && !p.is_for_rent);
    
    let totals = { soldPrice: 0, totalCommission: 0, agentShare: 0, agencyProfit: 0 };
    
    const rows = soldProperties.map(p => {
        const agentShare = (p.total_commission || 0) * ((p.agent_share_percentage || 0) / 100);
        const agencyProfit = (p.total_commission || 0) - agentShare;

        totals.soldPrice += p.sold_price || 0;
        totals.totalCommission += p.total_commission || 0;
        totals.agentShare += agentShare;
        totals.agencyProfit += agencyProfit;

        return { ...p, agentShare, agencyProfit };
    });
    
    return { rows, totals };
  }, [properties]);

  const rentalReportData = useMemo(() => {
    if (!properties) return { rows: [], totals: { monthlyRent: 0, totalCommission: 0, agentShare: 0, agencyProfit: 0 } };
    const rentedProperties = properties.filter(p => p.status === 'Rent Out');
    
    let totals = { monthlyRent: 0, totalCommission: 0, agentShare: 0, agencyProfit: 0 };

    const rows = rentedProperties.map(p => {
        const totalCommission = p.rent_total_commission || 0;
        const agentShare = p.rent_agent_share || 0;
        const agencyProfit = totalCommission - agentShare;

        totals.monthlyRent += p.demand_amount; // Assuming demand_amount is monthly rent
        totals.totalCommission += totalCommission;
        totals.agentShare += agentShare;
        totals.agencyProfit += agencyProfit;
        
        return { ...p, agencyProfit, agentShare: p.rent_agent_share };
    });

    return { rows, totals };
  }, [properties]);


  if (isLoading) {
    return <div>Loading reports...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
          <LineChart />
          Reports
        </h1>
        <p className="text-muted-foreground">
          Analyze your agency's sales and rental performance.
        </p>
      </div>

      <Tabs defaultValue="sales">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="rental">Rental Report</TabsTrigger>
        </TabsList>
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Sales Performance</CardTitle>
              <CardDescription>Detailed report of all properties marked as sold.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Sale Date</TableHead>
                    <TableHead>Sold Price</TableHead>
                    <TableHead>Total Commission</TableHead>
                    <TableHead>Agent's Share</TableHead>
                    <TableHead>Agency Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {salesReportData.rows.map(p => (
                        <TableRow key={p.id}>
                            <TableCell>
                                <div className="font-medium">{p.auto_title}</div>
                                <div className="text-sm text-muted-foreground">{p.serial_no}</div>
                            </TableCell>
                            <TableCell>{p.sale_date ? new Date(p.sale_date).toLocaleDateString() : 'N/A'}</TableCell>
                            <TableCell>{formatCurrency(p.sold_price || 0, currency)}</TableCell>
                            <TableCell>{formatCurrency(p.total_commission || 0, currency)}</TableCell>
                            <TableCell>{formatCurrency(p.agentShare || 0, currency)}</TableCell>
                            <TableCell className="font-bold">{formatCurrency(p.agencyProfit || 0, currency)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={2} className="font-bold">Total</TableCell>
                        <TableCell className="font-bold">{formatCurrency(salesReportData.totals.soldPrice, currency)}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(salesReportData.totals.totalCommission, currency)}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(salesReportData.totals.agentShare, currency)}</TableCell>
                        <TableCell className="font-bold text-lg text-primary">{formatCurrency(salesReportData.totals.agencyProfit, currency)}</TableCell>
                    </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="rental">
           <Card>
            <CardHeader>
              <CardTitle>Rental Performance</CardTitle>
              <CardDescription>Detailed report of all properties marked as rent out.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Rent Out Date</TableHead>
                    <TableHead>Monthly Rent</TableHead>
                    <TableHead>Total Commission</TableHead>
                    <TableHead>Agent's Share</TableHead>
                    <TableHead>Agency Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {rentalReportData.rows.map(p => (
                         <TableRow key={p.id}>
                            <TableCell>
                                <div className="font-medium">{p.auto_title}</div>
                                <div className="text-sm text-muted-foreground">{p.serial_no}</div>
                            </TableCell>
                            <TableCell>{p.rent_out_date ? new Date(p.rent_out_date).toLocaleDateString() : 'N/A'}</TableCell>
                            <TableCell>{formatCurrency(p.demand_amount, currency)}</TableCell>
                            <TableCell>{formatCurrency(p.rent_total_commission || 0, currency)}</TableCell>
                            <TableCell>{formatCurrency(p.agentShare || 0, currency)}</TableCell>
                            <TableCell className="font-bold">{formatCurrency(p.agencyProfit || 0, currency)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                 <TableFooter>
                    <TableRow>
                        <TableCell colSpan={2} className="font-bold">Total</TableCell>
                        <TableCell className="font-bold">{formatCurrency(rentalReportData.totals.monthlyRent, currency)}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(rentalReportData.totals.totalCommission, currency)}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(rentalReportData.totals.agentShare, currency)}</TableCell>
                        <TableCell className="font-bold text-lg text-primary">{formatCurrency(rentalReportData.totals.agencyProfit, currency)}</TableCell>
                    </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
