
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Video, Check, MoreHorizontal, XCircle, Eye } from 'lucide-react';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PropertyDetailsDialog } from '@/components/property-details-dialog';

export default function RecordingPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { profile } = useProfile();
  const { searchQuery, setSearchQuery } = useSearch();
  const [propertyForReason, setPropertyForReason] = useState<Property | null>(null);
  const [propertyForDetails, setPropertyForDetails] = useState<Property | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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

  const handleCardClick = (property: Property) => {
      setPropertyForDetails(property);
      setIsDetailsOpen(true);
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
      
      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Loading pending recordings...</div>
      ) : filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map(prop => (
                <Card key={prop.id} className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleCardClick(prop)}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <Badge variant="outline">{prop.serial_no}</Badge>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2" onClick={(e) => e.stopPropagation()}>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuItem onSelect={() => handleMarkAsRecorded(prop)}>
                                        <Check className="mr-2 h-4 w-4" />
                                        Mark as Recorded
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleCannotRecord(prop)} className="text-destructive focus:bg-destructive/10">
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Cannot Record
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <CardTitle className="pt-2 font-bold font-headline text-base">{prop.auto_title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <p className="text-sm text-muted-foreground">{prop.area}</p>
                    </CardContent>
                    <CardFooter>
                         <Button variant="outline" className="w-full" onClick={(e) => {e.stopPropagation(); handleCardClick(prop)}}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground bg-card rounded-lg">
            No pending recordings found.
        </div>
      )}
    </div>
    {propertyForReason && (
        <CannotRecordDialog 
            isOpen={!!propertyForReason}
            setIsOpen={() => setPropertyForReason(null)}
            property={propertyForReason}
            onSave={handleSaveReason}
        />
    )}
     {propertyForDetails && (
        <PropertyDetailsDialog
            property={propertyForDetails}
            isOpen={isDetailsOpen}
            setIsOpen={setIsDetailsOpen}
        />
    )}
    </>
  );
}
