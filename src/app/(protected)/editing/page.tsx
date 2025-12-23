
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, MoreHorizontal, PlayCircle, CheckCheck } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Property, EditingStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc, updateDoc, query, where } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/hooks';
import { useProfile } from '@/context/profile-context';
import { RecordVideoDialog } from '@/components/record-video-dialog';
import { useSearch } from '../layout';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EditingPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { profile } = useProfile();
    const { searchQuery, setSearchQuery } = useSearch();
    const [propertyForLinks, setPropertyForLinks] = useState<Property | null>(null);
    const [isLinksDialogOpen, setIsLinksDialogOpen] = useState(false);

    const propertiesQuery = useMemoFirebase(() => 
        profile.agency_id && profile.user_id
            ? query(
                collection(firestore, 'agencies', profile.agency_id, 'properties'), 
                where('assignedTo', '==', profile.user_id),
                where('is_recorded', '==', true)
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
    
    const handleStatusUpdate = async (property: Property, status: EditingStatus) => {
        if (!profile.agency_id) return;
        try {
            const propRef = doc(firestore, 'agencies', profile.agency_id, 'properties', property.id);
            await updateDoc(propRef, { editing_status: status });
            
            if (status === 'Complete') {
                setPropertyForLinks(property);
                setIsLinksDialogOpen(true);
            } else {
                 toast({
                    title: `Status set to "${status}"`,
                });
            }
        } catch (error) {
            console.error("Error updating editing status:", error);
            toast({ title: "Error", description: "Could not update status.", variant: "destructive" });
        }
    };
    
    const handleUpdatePropertyLinks = async (updatedProperty: Property) => {
        if (!profile.agency_id) return;
        const propRef = doc(firestore, 'agencies', profile.agency_id, 'properties', updatedProperty.id);
        await updateDoc(propRef, { 
            video_links: updatedProperty.video_links,
            editing_status: 'Complete' // Ensure status is set
        });
        toast({ title: 'Video Links Saved', description: `Links for ${updatedProperty.auto_title} have been updated.` });
    };

    const statusConfig: Record<EditingStatus, { color: string, icon: React.ElementType }> = {
        'In Editing': { color: 'bg-yellow-500/80 hover:bg-yellow-500', icon: PlayCircle },
        'Complete': { color: 'bg-green-600/80 hover:bg-green-600', icon: CheckCheck },
    };

    return (
        <>
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2"><Edit /> Video Editing Queue</h1>
                <p className="text-muted-foreground">Manage the editing status of your recorded videos.</p>
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
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoading ? (
                        <TableRow><TableCell colSpan={4} className="text-center h-24">Loading editing queue...</TableCell></TableRow>
                    ) : filteredProperties.length > 0 ? (
                        filteredProperties.map(prop => {
                            const currentStatus = prop.editing_status || 'In Editing';
                            const Icon = statusConfig[currentStatus].icon;
                            return (
                                <TableRow key={prop.id}>
                                    <TableCell><Badge variant="outline">{prop.serial_no}</Badge></TableCell>
                                    <TableCell className="font-medium">{prop.auto_title}</TableCell>
                                    <TableCell>
                                        <Badge className={cn(statusConfig[currentStatus].color)}>
                                            <Icon className="mr-1 h-3 w-3" />
                                            {currentStatus}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onSelect={() => handleStatusUpdate(prop, 'In Editing')}>
                                                    <PlayCircle className="mr-2" /> Mark as In Editing
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleStatusUpdate(prop, 'Complete')}>
                                                     <CheckCheck className="mr-2" /> Mark as Complete & Add Links
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    ) : (
                        <TableRow><TableCell colSpan={4} className="text-center h-24">No recorded videos in the queue.</TableCell></TableRow>
                    )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </div>
        {propertyForLinks && (
            <RecordVideoDialog 
                property={propertyForLinks}
                isOpen={isLinksDialogOpen}
                setIsOpen={setIsLinksDialogOpen}
                onUpdateProperty={handleUpdatePropertyLinks}
            />
        )}
        </>
    );
}
