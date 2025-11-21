'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, RotateCcw } from 'lucide-react';
import type { Property, Buyer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/hooks';
import { useProfile } from '@/context/profile-context';


export default function TrashPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { profile } = useProfile();

  // Agency-wide queries
  const agencyPropertiesQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'properties') : null, [profile.agency_id, firestore]);
  const { data: agencyProperties, isLoading: apLoading } = useCollection<Property>(agencyPropertiesQuery);
  
  const agencyBuyersQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'buyers') : null, [profile.agency_id, firestore]);
  const { data: agencyBuyers, isLoading: abLoading } = useCollection<Buyer>(agencyBuyersQuery);
  
  // Agent-specific queries
  const agentPropertiesQuery = useMemoFirebase(() => profile.user_id ? collection(firestore, 'agents', profile.user_id, 'properties') : null, [profile.user_id, firestore]);
  const { data: agentProperties, isLoading: agentPLoading } = useCollection<Property>(agentPropertiesQuery);

  const agentBuyersQuery = useMemoFirebase(() => profile.user_id ? collection(firestore, 'agents', profile.user_id, 'buyers') : null, [profile.user_id, firestore]);
  const { data: agentBuyers, isLoading: agentBLoading } = useCollection<Buyer>(agentBuyersQuery);

  const isLoading = apLoading || abLoading || (profile.role === 'Agent' && (agentPLoading || agentBLoading));

  const deletedProperties = useMemo(() => {
      const allProps = profile.role === 'Agent' ? [...(agencyProperties || []), ...(agentProperties || [])] : (agencyProperties || []);
      const uniqueProps = Array.from(new Map(allProps.map(p => [p.id, p])).values());
      
      let props = uniqueProps.filter(p => p.is_deleted);
      if (profile.role === 'Agent') {
          props = props.filter(p => p.created_by === profile.user_id);
      }
      return props;
  }, [agencyProperties, agentProperties, profile.role, profile.user_id]);

  const deletedBuyers = useMemo(() => {
      const allBuyersData = profile.role === 'Agent' ? [...(agencyBuyers || []), ...(agentBuyers || [])] : (agencyBuyers || []);
      const uniqueBuyers = Array.from(new Map(allBuyersData.map(b => [b.id, b])).values());
      
      let buyers = uniqueBuyers.filter(b => b.is_deleted);
      if (profile.role === 'Agent') {
          buyers = buyers.filter(b => b.created_by === profile.user_id);
      }
      return buyers;
  }, [agencyBuyers, agentBuyers, profile.role, profile.user_id]);
  
  
  const handleRestoreProperty = async (prop: Property) => {
    const collectionName = prop.created_by === profile.user_id ? 'agents' : 'agencies';
    const collectionId = collectionName === 'agents' ? profile.user_id : profile.agency_id;
    if (!collectionId) return;

    await setDoc(doc(firestore, collectionName, collectionId, 'properties', prop.id), { is_deleted: false }, { merge: true });
    toast({ title: 'Property Restored', description: 'The property has been successfully restored.' });
  };
  
  const handlePermanentDeleteProperty = async (prop: Property) => {
    const collectionName = prop.created_by === profile.user_id ? 'agents' : 'agencies';
    const collectionId = collectionName === 'agents' ? profile.user_id : profile.agency_id;
    if (!collectionId) return;

    await deleteDoc(doc(firestore, collectionName, collectionId, 'properties', prop.id));
    toast({ title: 'Property Deleted Permanently', variant: 'destructive', description: 'The property has been permanently removed.' });
  };
  
  const handleRestoreBuyer = async (buyer: Buyer) => {
    const collectionName = buyer.created_by === profile.user_id ? 'agents' : 'agencies';
    const collectionId = collectionName === 'agents' ? profile.user_id : profile.agency_id;
    if (!collectionId) return;

    await setDoc(doc(firestore, collectionName, collectionId, 'buyers', buyer.id), { is_deleted: false }, { merge: true });
    toast({ title: 'Buyer Restored', description: 'The buyer has been successfully restored.' });
  };
  
  const handlePermanentDeleteBuyer = async (buyer: Buyer) => {
    const collectionName = buyer.created_by === profile.user_id ? 'agents' : 'agencies';
    const collectionId = collectionName === 'agents' ? profile.user_id : profile.agency_id;
    if (!collectionId) return;

    await deleteDoc(doc(firestore, collectionName, collectionId, 'buyers', buyer.id));
    toast({ title: 'Buyer Deleted Permanently', variant: 'destructive', description: 'The buyer has been permanently removed.' });
  };

  const PermanentDeleteDialog = ({ onConfirm }: { onConfirm: () => void }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" /> Delete Permanently</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the item from the database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Trash</h1>
        <p className="text-muted-foreground">
          Manage and restore deleted items. Items are permanently deleted after 30 days.
        </p>
      </div>

      <Tabs defaultValue="properties">
        <TabsList>
          <TabsTrigger value="properties">Properties ({deletedProperties.length})</TabsTrigger>
          <TabsTrigger value="buyers">Buyers ({deletedBuyers.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="properties">
          <Card>
            <CardHeader>
              <CardTitle>Deleted Properties</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <p className="text-center py-10 text-muted-foreground">Loading...</p> : 
              deletedProperties.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No deleted properties.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial No</TableHead>
                      <TableHead>Property Title</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedProperties.map(prop => (
                      <TableRow key={prop.id}>
                        <TableCell><Badge variant="outline">{prop.serial_no}</Badge></TableCell>
                        <TableCell>{prop.auto_title}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleRestoreProperty(prop)}><RotateCcw className="mr-2 h-4 w-4" /> Restore</Button>
                          <PermanentDeleteDialog onConfirm={() => handlePermanentDeleteProperty(prop)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="buyers">
          <Card>
            <CardHeader>
              <CardTitle>Deleted Buyers</CardTitle>
            </CardHeader>
            <CardContent>
               {isLoading ? <p className="text-center py-10 text-muted-foreground">Loading...</p> :
               deletedBuyers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No deleted buyers.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial No</TableHead>
                      <TableHead>Buyer Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedBuyers.map(buyer => (
                      <TableRow key={buyer.id}>
                        <TableCell><Badge variant="outline">{buyer.serial_no}</Badge></TableCell>
                        <TableCell>{buyer.name}</TableCell>
                        <TableCell>{buyer.phone}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleRestoreBuyer(buyer)}><RotateCcw className="mr-2 h-4 w-4" /> Restore</Button>
                          <PermanentDeleteDialog onConfirm={() => handlePermanentDeleteBuyer(buyer)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
