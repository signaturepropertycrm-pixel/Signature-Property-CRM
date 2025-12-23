
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Video, Check, MoreHorizontal, XCircle } from 'lucide-react';
import type { Property } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc, updateDoc, query, where } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/hooks';
import { useProfile } from '@/context/profile-context';
import { useSearch } from '../layout';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { CannotRecordDialog } from '@/components/cannot-record-dialog';

export default function RecordingPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { profile } = useProfile();
  const { searchQuery, setSearchQuery } = useSearch();
  const [propertyForReason, setPropertyForReason] = useState<Property | null>(null);

  const propertiesQuery = useMemoFirebase(() => 
    profile.agency_id && profile.user_id
        ? query(
            collection(firestore, 'agencies', profile.agency_id, 'properties'), 
            where('assignedTo', '==', profile.user_id),
            where('is_recorded', '==', false)
          ) 
        : null, 
    [firestore, profile.agency_id, profile.user_id]
  );
  const { data: properties, isLoading } = useCollection<Property>(propertiesQuery);

  const filteredProperties = useMemo(() => {
    if (!properties) return [];
    if (!searchQuery) return properties;

    const lowercasedQuery = searchQuery.toLowerCase();
    return properties.filter(prop => 
        prop.serial_no.toLowerCase().includes(lowercasedQuery) ||
        prop.auto_title.toLowerCase().includes(lowercasedQuery) ||
        prop.address.toLowerCase().includes(lowercasedQuery)
    );
  }, [properties, searchQuery]);

  const handleMarkAsRecorded = async (property: Property) => {
    if (!profile.agency_id) return;
    try {
      const propRef = doc(firestore, 'agencies', profile.agency_id, 'properties', property.id);
      await updateDoc(propRef, {
        is_recorded: true,
        editing_status: 'In Editing' // Set initial status for next stage
      });
      toast({
        title: "Marked as Recorded",
        description: `${property.serial_no} has been moved to the editing queue.`,
      });
    } catch (error) {
      console.error("Error marking as recorded:", error);
      toast({ title: "Error", description: "Could not update property status.", variant: "destructive" });
    }
  };

  const handleCannotRecord = (property: Property) => {
      setPropertyForReason(property);
  }

  const handleSaveReason = async (property: Property, reason: string) => {
      if (!profile.agency_id) return;
      try {
          const propRef = doc(firestore, 'agencies', profile.agency_id, 'properties', property.id);
          await updateDoc(propRef, {
              recording_notes: reason,
              assignedTo: null // Un-assign the property
          });
          toast({
              title: "Reason Submitted",
              description: `Reason for ${property.serial_no} has been sent to the admin.`,
          });
          setPropertyForReason(null);
      } catch (error) {
           console.error("Error saving reason:", error);
           toast({ title: "Error", description: "Could not save reason.", variant: "destructive" });
      }
  }

  return (
    <>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2"><Video /> Pending Recordings</h1>
        <p className="text-muted-foreground">Properties assigned to you for video recording.</p>
      </div>

      <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by SN, Title, or Address..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serial No</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Area</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center h-24">Loading pending recordings...</TableCell></TableRow>
              ) : filteredProperties.length > 0 ? (
                filteredProperties.map(prop => (
                  <TableRow key={prop.id}>
                    <TableCell><Badge variant="outline">{prop.serial_no}</Badge></TableCell>
                    <TableCell className="font-medium">{prop.auto_title}</TableCell>
                    <TableCell>{prop.area}</TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="destructive" size="sm" onClick={() => handleCannotRecord(prop)}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Cannot Record
                        </Button>
                      <Button onClick={() => handleMarkAsRecorded(prop)}>
                        <Check className="mr-2 h-4 w-4" />
                        Mark as Recorded
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="text-center h-24">No pending recordings found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    {propertyForReason && (
        <CannotRecordDialog 
            isOpen={!!propertyForReason}
            setIsOpen={() => setPropertyForReason(null)}
            property={propertyForReason}
            onSave={handleSaveReason}
        />
    )}
    </>
  );
}
