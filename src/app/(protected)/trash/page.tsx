
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, RotateCcw } from 'lucide-react';
import type { Property, Buyer, ListingType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc, setDoc, deleteDoc, writeBatch, getDocs, query, where } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/hooks';
import { useProfile } from '@/context/profile-context';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';


export default function TrashPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { profile } = useProfile();

  const agencyPropertiesQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'properties') : null, [profile.agency_id, firestore]);
  const { data: agencyProperties, isLoading: apLoading } = useCollection<Property>(agencyPropertiesQuery);
  
  const agencyBuyersQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'buyers') : null, [profile.agency_id, firestore]);
  const { data: agencyBuyers, isLoading: abLoading } = useCollection<Buyer>(agencyBuyersQuery);
  
  const isLoading = apLoading || abLoading;

  const deletedProperties = useMemo(() => {
      let props = (agencyProperties || []).filter(p => p.is_deleted);
      if (profile.role === 'Agent') {
          props = props.filter(p => p.created_by === profile.user_id);
      }
      return props;
  }, [agencyProperties, profile.role, profile.user_id]);

  const deletedBuyers = useMemo(() => {
      let buyers = (agencyBuyers || []).filter(b => b.is_deleted);
      if (profile.role === 'Agent') {
          buyers = buyers.filter(b => b.created_by === profile.user_id);
      }
      return buyers;
  }, [agencyBuyers, profile.role, profile.user_id]);
  
  
  const handleRestoreProperty = async (prop: Property) => {
    if (!profile.agency_id) return;
    await setDoc(doc(firestore, 'agencies', profile.agency_id, 'properties', prop.id), { is_deleted: false }, { merge: true });
    toast({ title: 'Property Restored', description: 'The property has been successfully restored.' });
  };
  
  const handlePermanentDeleteProperty = async (propToDelete: Property) => {
    if (!profile.agency_id) return;
    const batch = writeBatch(firestore);
    
    // 1. Delete the specified property
    const docRef = doc(firestore, 'agencies', profile.agency_id, 'properties', propToDelete.id);
    batch.delete(docRef);

    // 2. Resequence remaining properties of the same type
    const prefix = propToDelete.is_for_rent ? 'RP' : 'P';
    const remainingProperties = (agencyProperties || [])
      .filter(p => p.id !== propToDelete.id && !p.is_deleted && p.is_for_rent === propToDelete.is_for_rent)
      .sort((a, b) => {
        const aNum = parseInt(a.serial_no.split('-')[1], 10);
        const bNum = parseInt(b.serial_no.split('-')[1], 10);
        return aNum - bNum;
      });
      
    remainingProperties.forEach((p, index) => {
      const newSerial = `${prefix}-${index + 1}`;
      if (p.serial_no !== newSerial) {
        const propRef = doc(firestore, 'agencies', profile.agency_id, 'properties', p.id);
        batch.update(propRef, { serial_no: newSerial });
      }
    });

    await batch.commit();
    toast({ title: 'Property Deleted & Resequenced', variant: 'destructive', description: 'The property has been permanently removed and serials updated.' });
  };

  const handleEmptyPropertiesTrash = async () => {
    if (deletedProperties.length === 0 || !profile.agency_id) return;

    const batch = writeBatch(firestore);
    deletedProperties.forEach(prop => {
        const docRef = doc(firestore, 'agencies', profile.agency_id, 'properties', prop.id);
        batch.delete(docRef);
    });

    await batch.commit();
    toast({ title: 'Properties Trash Emptied', variant: 'destructive', description: `${deletedProperties.length} properties have been permanently removed.` });
  }
  
  const handleRestoreBuyer = async (buyer: Buyer) => {
    if (!profile.agency_id) return;
    await setDoc(doc(firestore, 'agencies', profile.agency_id, 'buyers', buyer.id), { is_deleted: false }, { merge: true });
    toast({ title: 'Buyer Restored', description: 'The buyer has been successfully restored.' });
  };
  
  const handlePermanentDeleteBuyer = async (buyerToDelete: Buyer) => {
    if (!profile.agency_id) return;
    const batch = writeBatch(firestore);
    
    // 1. Delete the buyer
    const docRef = doc(firestore, 'agencies', profile.agency_id, 'buyers', buyerToDelete.id);
    batch.delete(docRef);

    // 2. Resequence remaining buyers of the same listing type
    const buyerListingType = buyerToDelete.listing_type || 'For Sale';
    const prefix = buyerListingType === 'For Rent' ? 'RB' : 'B';
    
    const remainingBuyers = (agencyBuyers || [])
        .filter(b => b.id !== buyerToDelete.id && !b.is_deleted && (b.listing_type || 'For Sale') === buyerListingType)
        .sort((a, b) => {
            const aNum = parseInt(a.serial_no.split('-')[1], 10);
            const bNum = parseInt(b.serial_no.split('-')[1], 10);
            return aNum - bNum;
        });

    remainingBuyers.forEach((b, index) => {
        const newSerial = `${prefix}-${index + 1}`;
        if (b.serial_no !== newSerial) {
            const buyerRef = doc(firestore, 'agencies', profile.agency_id, 'buyers', b.id);
            batch.update(buyerRef, { serial_no: newSerial });
        }
    });

    await batch.commit();
    toast({ title: 'Buyer Deleted & Resequenced', variant: 'destructive', description: 'The buyer has been permanently removed and serials updated.' });
  };

  const handleEmptyBuyersTrash = async () => {
    if (deletedBuyers.length === 0 || !profile.agency_id) return;

    const batch = writeBatch(firestore);
    deletedBuyers.forEach(buyer => {
       const docRef = doc(firestore, 'agencies', profile.agency_id, 'buyers', buyer.id);
       batch.delete(docRef);
    });

    await batch.commit();
    toast({ title: 'Buyers Trash Emptied', variant: 'destructive', description: `${deletedBuyers.length} buyers have been permanently removed.` });
  }

  const PermanentDeleteDialog = ({ onConfirm, title, description, children }: { onConfirm: () => void, title: string, description: string, children: React.ReactNode }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
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
    <TooltipProvider>
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
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Deleted Properties</CardTitle>
               <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={deletedProperties.length === 0}><Trash2 className="mr-2 h-4 w-4" /> Clear All</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all {deletedProperties.length} properties in the trash. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleEmptyPropertiesTrash}>Confirm & Empty Trash</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={() => handleRestoreProperty(prop)}><RotateCcw className="h-4 w-4" /></Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Restore</p></TooltipContent>
                          </Tooltip>
                          <PermanentDeleteDialog onConfirm={() => handlePermanentDeleteProperty(prop)} title="Are you sure?" description="This action is permanent and cannot be undone.">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Delete Permanently</p></TooltipContent>
                            </Tooltip>
                          </PermanentDeleteDialog>
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
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Deleted Buyers</CardTitle>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={deletedBuyers.length === 0}><Trash2 className="mr-2 h-4 w-4" /> Clear All</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all {deletedBuyers.length} buyers in the trash. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleEmptyBuyersTrash}>Confirm & Empty Trash</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
                          <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" onClick={() => handleRestoreBuyer(buyer)}><RotateCcw className="h-4 w-4" /></Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Restore</p></TooltipContent>
                          </Tooltip>
                          <PermanentDeleteDialog onConfirm={() => handlePermanentDeleteBuyer(buyer)} title="Are you sure?" description="This action is permanent and cannot be undone.">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Delete Permanently</p></TooltipContent>
                            </Tooltip>
                          </PermanentDeleteDialog>
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
    </TooltipProvider>
  );
}
