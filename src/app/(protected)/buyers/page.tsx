

'use client';
import { AddBuyerDialog } from '@/components/add-buyer-dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { buyerStatuses } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Edit, MoreHorizontal, PlusCircle, Trash2, Phone, Home, Search, Filter, Wallet, Bookmark, Upload, Download, Ruler, Eye, CalendarPlus, UserCheck, Briefcase, Check, X, UserPlus, UserX, ChevronDown } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { Buyer, BuyerStatus, PriceUnit, SizeUnit, PropertyType, AppointmentContactType, Appointment, FollowUp, User, Activity, ListingType } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSearch, useUI } from '../layout';
import { BuyerDetailsDialog } from '@/components/buyer-details-dialog';
import { SetAppointmentDialog } from '@/components/set-appointment-dialog';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatUnit } from '@/lib/formatters';
import { useCurrency } from '@/context/currency-context';
import { useProfile } from '@/context/profile-context';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, addDoc, setDoc, doc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/hooks';
import { AddFollowUpDialog } from '@/components/add-follow-up-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import React from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

const statusVariant = {
    'New': 'default',
    'Interested': 'default',
    'Not Interested': 'destructive',
    'Follow Up': 'default',
    'Visited Property': 'secondary',
    'Deal Closed': 'default',
} as const;

function formatSize(minAmount?: number, minUnit?: SizeUnit, maxAmount?: number, maxUnit?: SizeUnit) {
    if (!minAmount || !minUnit) return 'N/A';
    if (!maxAmount || !maxUnit || (minAmount === maxAmount && minUnit === maxUnit)) return `${minAmount} ${minUnit}`;
    return `${minAmount} - ${maxAmount} ${maxUnit}`;
}

interface Filters {
    status: BuyerStatus | 'All';
    area: string;
    minBudget: string;
    maxBudget: string;
    budgetUnit: PriceUnit | 'All';
    propertyType: PropertyType | 'All';
    minSize: string;
    maxSize: string;
    sizeUnit: SizeUnit | 'All';
}

export default function BuyersPage() {
    const isMobile = useIsMobile();
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useUser();
    const { profile } = useProfile();
    const searchParams = useSearchParams();
    const { searchQuery } = useSearch();
    const { isMoreMenuOpen } = useUI();
    const { toast } = useToast();
    const { currency } = useCurrency();
    const statusFilterFromURL = searchParams.get('status') as BuyerStatus | 'All' | null;
    const listingTypeFilterFromURL = searchParams.get('type') as ListingType | null;

    const activeTab = listingTypeFilterFromURL || 'For Sale';
    const firestore = useFirestore();

    const agencyBuyersQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'buyers') : null, [profile.agency_id, firestore]);
    const { data: allBuyers, isLoading: isAgencyLoading } = useCollection<Buyer>(agencyBuyersQuery);

    const teamMembersQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'teamMembers') : null, [profile.agency_id, firestore]);
    const { data: teamMembers } = useCollection<User>(teamMembersQuery);

    const followUpsQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'followUps') : null, [profile.agency_id, firestore]);
    const { data: followUps, isLoading: isFollowUpsLoading } = useCollection<FollowUp>(followUpsQuery);

    const activeAgents = useMemo(() => teamMembers?.filter(m => m.status === 'Active') || [], [teamMembers]);
    
    const { totalSaleBuyers, totalRentBuyers } = useMemo(() => {
        if (!allBuyers) return { totalSaleBuyers: 0, totalRentBuyers: 0 };
        return {
            totalSaleBuyers: allBuyers.filter(b => b.listing_type === 'For Sale').length,
            totalRentBuyers: allBuyers.filter(b => b.listing_type === 'For Rent').length
        };
    }, [allBuyers]);

    const [isAddBuyerOpen, setIsAddBuyerOpen] = useState(false);
    const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
    const [buyerToEdit, setBuyerToEdit] = useState<Buyer | null>(null);
    const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
    const [buyerForFollowUp, setBuyerForFollowUp] = useState<Buyer | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
    const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
    const [appointmentDetails, setAppointmentDetails] = useState<{ contactType: AppointmentContactType; contactName: string; contactSerialNo?: string; message: string; } | null>(null);
    const [filters, setFilters] = useState<Filters>({ status: 'All', area: '', minBudget: '', maxBudget: '', budgetUnit: 'All', propertyType: 'All', minSize: '', maxSize: '', sizeUnit: 'All' });
    const [activeStatusFilter, setActiveStatusFilter] = useState<BuyerStatus | 'All'>('All');


    const buyerFollowUp = useMemo(() => {
        if (!buyerForFollowUp || !followUps) return null;
        return followUps.find(fu => fu.buyerId === buyerForFollowUp.id);
    }, [buyerForFollowUp, followUps]);

    useEffect(() => {
        if (!isAddBuyerOpen) setBuyerToEdit(null);
    }, [isAddBuyerOpen]);
    
    // When the dialog closes, clear the selected buyer to ensure fresh data is loaded next time
    useEffect(() => {
        if (!isDetailsOpen) {
            setSelectedBuyer(null);
        }
    }, [isDetailsOpen]);

    // When the master list of buyers changes, update the selected buyer if it exists
    useEffect(() => {
        if (selectedBuyer && allBuyers) {
            const updatedBuyer = allBuyers.find(b => b.id === selectedBuyer.id);
            if (updatedBuyer) {
                setSelectedBuyer(updatedBuyer);
            }
        }
    }, [allBuyers, selectedBuyer]);
    
    const logActivity = async (action: string, target: string, targetType: Activity['targetType'], details: any = null) => {
        if (!profile.agency_id) return;
        const activityLogRef = collection(firestore, 'agencies', profile.agency_id, 'activityLogs');
        const newActivity: Omit<Activity, 'id'> = {
        userName: profile.name,
        action,
        target,
        targetType,
        details,
        timestamp: new Date().toISOString(),
        agency_id: profile.agency_id,
        };
        await addDoc(activityLogRef, newActivity);
    };


    const formatBudget = (minAmount?: number, minUnit?: PriceUnit, maxAmount?: number, maxUnit?: PriceUnit) => {
        if (!minAmount || !minUnit) return 'N/A';
        const minVal = formatUnit(minAmount, minUnit);
        if (!maxAmount || !maxUnit || (minAmount === maxAmount && minUnit === maxUnit)) return formatCurrency(minVal, currency);
        const maxVal = formatUnit(maxAmount, maxUnit);
        return `${formatCurrency(minVal, currency)} - ${formatCurrency(maxVal, currency)}`;
    };

    const handleEdit = (buyer: Buyer) => {
        setBuyerToEdit(buyer);
        setIsAddBuyerOpen(true);
    };

    const handleDetailsClick = (buyer: Buyer) => {
        if (isMobile) return;
        setSelectedBuyer({ ...buyer });
        setIsDetailsOpen(true);
    };

    const handleSetAppointment = (buyer: Buyer) => {
        setAppointmentDetails({
            contactType: 'Buyer',
            contactName: buyer.name,
            contactSerialNo: buyer.serial_no,
            message: `Regarding buyer's interest in ${buyer.area_preference || 'general properties'}.`,
        });
        setIsAppointmentOpen(true);
    };

    const handleSaveAppointment = async (appointment: Appointment) => {
        if (!profile.agency_id) return;
        const { id, ...newAppointmentData } = appointment;
        const newAppointmentRef = await addDoc(collection(firestore, 'agencies', profile.agency_id, 'appointments'), newAppointmentData);
        await logActivity('scheduled an appointment for buyer', appointment.contactName || 'N/A', 'Appointment');
    };

    const handleDelete = async (buyer: Buyer) => {
        if (!profile.agency_id) return;

        const docRef = doc(firestore, 'agencies', profile.agency_id, 'buyers', buyer.id);
        await setDoc(docRef, { is_deleted: true }, { merge: true });
        toast({ title: "Buyer Moved to Trash", description: "You can restore them from the trash page." });
    };

    const handleFilterChange = (key: keyof Filters, value: string | BuyerStatus | PropertyType | PriceUnit | SizeUnit) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({ status: 'All', area: '', minBudget: '', maxBudget: '', budgetUnit: 'All', propertyType: 'All', minSize: '', maxSize: '', sizeUnit: 'All' });
        setActiveStatusFilter('All');
        setIsFilterPopoverOpen(false);
    };
    
    const handleAssignAgent = async (buyer: Buyer, agentId: string | null) => {
        if (!profile.agency_id) return;
    
        // This is the safety check.
        const newAssignedTo = agentId === undefined ? null : agentId;
    
        const docRef = doc(firestore, 'agencies', profile.agency_id, 'buyers', buyer.id);
        await setDoc(docRef, { assignedTo: newAssignedTo }, { merge: true });
        
        // This is the crucial part: update the local state immediately
        // so the dialog reflects the change without needing a full data refetch.
        if (selectedBuyer) {
            setSelectedBuyer({
                ...selectedBuyer,
                assignedTo: newAssignedTo,
            });
        }
        
        const agentName = activeAgents.find(a => a.id === newAssignedTo)?.name;
    
        toast({
          title: newAssignedTo ? 'Buyer Assigned' : 'Buyer Unassigned',
          description: newAssignedTo
            ? `Buyer ${buyer.name} assigned to ${agentName}.`
            : `Buyer ${buyer.name} has been unassigned.`
        });
    };

    const handleStatusChange = async (buyer: Buyer, newStatus: BuyerStatus) => {
        if (newStatus === 'Follow Up') {
            setBuyerForFollowUp(buyer);
            setIsFollowUpOpen(true);
        } else {
            if (!profile.agency_id) return;

            const docRef = doc(firestore, 'agencies', profile.agency_id, 'buyers', buyer.id);
            await setDoc(docRef, { status: newStatus }, { merge: true });
            
            await logActivity('updated the status', buyer.name, 'Buyer', { from: buyer.status, to: newStatus });

            if (buyer.status === 'Follow Up' && followUps && profile.agency_id) {
                const followUpToDelete = followUps.find(fu => fu.buyerId === buyer.id);
                if (followUpToDelete) await deleteDoc(doc(firestore, 'agencies', profile.agency_id, 'followUps', followUpToDelete.id));
            }
        }
    };

    const handleSaveFollowUp = async (buyerId: string, notes: string, nextReminderDate: string, nextReminderTime: string, existingFollowUp?: FollowUp | null) => {
        if (!profile.agency_id || !allBuyers) return;
        const buyer = allBuyers.find(b => b.id === buyerId);
        if (!buyer) return;

        const newFollowUpData: Partial<FollowUp> = {
            buyerId: buyer.id,
            buyerName: buyer.name,
            buyerPhone: buyer.phone,
            propertyInterest: buyer.area_preference || 'General',
            nextReminderDate: nextReminderDate,
            nextReminderTime: nextReminderTime,
            status: 'Scheduled',
            notes: notes,
            agency_id: profile.agency_id
        };

        const followUpsCollection = collection(firestore, 'agencies', profile.agency_id, 'followUps');
        const buyerDocRef = doc(firestore, 'agencies', profile.agency_id, 'buyers', buyerId);

        let action = 'scheduled a follow-up';
        if (existingFollowUp) {
            newFollowUpData.lastContactDate = existingFollowUp.nextReminderDate;
            newFollowUpData.lastContactTime = existingFollowUp.nextReminderTime;
            await setDoc(doc(followUpsCollection, existingFollowUp.id), newFollowUpData, { merge: true });
            action = 'rescheduled a follow-up';
        } else {
            newFollowUpData.lastContactDate = new Date().toISOString().split('T')[0];
            newFollowUpData.lastContactTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            await addDoc(followUpsCollection, newFollowUpData);
        }
        
        await logActivity(action, buyer.name, 'FollowUp');
        await setDoc(buyerDocRef, { status: 'Follow Up', last_follow_up_note: notes }, { merge: true });

        toast({ title: "Follow-up Scheduled", description: `A follow-up has been created for ${buyer.name}.` });
        setIsFollowUpOpen(false);
        setBuyerForFollowUp(null);
    };

    const handleSaveBuyer = async (buyerData: Omit<Buyer, 'id'> & { id?: string }) => {
        if (buyerToEdit) {
            if (!profile.agency_id || !buyerData.id) return;
            const docRef = doc(firestore, 'agencies', profile.agency_id, 'buyers', buyerData.id);
            await setDoc(docRef, buyerData, { merge: true });
            toast({ title: 'Buyer Updated' });
        } else {
            if (!profile.agency_id) return;
            const collectionRef = collection(firestore, 'agencies', profile.agency_id, 'buyers');
            const { id, ...restOfData } = buyerData;
            const newDocRef = await addDoc(collectionRef, { ...restOfData, agency_id: profile.agency_id });
            await logActivity('added a new buyer', buyerData.name, 'Buyer');
            toast({ title: 'Buyer Added' });
        }
        setBuyerToEdit(null);
    };

    const filteredBuyers = useMemo(() => {
        if (!allBuyers) return [];
        let filtered: Buyer[] = [...allBuyers].filter(b => !b.is_deleted);
        
        filtered = filtered.filter(b => (b.listing_type || 'For Sale') === activeTab);

        if (profile.role === 'Agent') {
            filtered = filtered.filter(b => b.created_by === profile.user_id);
        }

        if (activeStatusFilter && activeStatusFilter !== 'All') {
            filtered = filtered.filter(b => b.status === activeStatusFilter);
        }
        
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(buyer =>
                buyer.name.toLowerCase().includes(lowercasedQuery) ||
                (buyer.area_preference && buyer.area_preference.toLowerCase().includes(lowercasedQuery)) ||
                buyer.serial_no.toLowerCase().includes(lowercasedQuery)
            );
        }
        
        if (filters.area) filtered = filtered.filter(b => b.area_preference && b.area_preference.toLowerCase().includes(filters.area.toLowerCase()));
        if (filters.minBudget) filtered = filtered.filter(b => b.budget_min_amount && b.budget_min_amount >= Number(filters.minBudget) && (filters.budgetUnit === 'All' || b.budget_min_unit === filters.budgetUnit));
        if (filters.maxBudget) filtered = filtered.filter(b => b.budget_max_amount && b.budget_max_amount <= Number(filters.maxBudget) && (filters.budgetUnit === 'All' || b.budget_max_unit === filters.budgetUnit));
        if (filters.propertyType !== 'All') filtered = filtered.filter(p => p.property_type_preference === filters.propertyType);
        if (filters.minSize) filtered = filtered.filter(p => p.size_min_value && p.size_min_value >= Number(filters.minSize) && (filters.sizeUnit === 'All' || p.size_min_unit === filters.sizeUnit));
        if (filters.maxSize) filtered = filtered.filter(p => p.size_max_value && p.size_max_value <= Number(filters.maxSize) && (filters.sizeUnit === 'All' || p.size_max_unit === filters.sizeUnit));

        return filtered;
    }, [searchQuery, filters, allBuyers, profile.role, profile.user_id, activeTab, activeStatusFilter]);


    const handleTabChange = (value: string) => {
        const url = `${pathname}?type=${value}`;
        router.push(url);
        setActiveStatusFilter('All'); // Reset status filter on tab change
    };

    const handleAddBuyerClick = () => {
        if (user && !user.emailVerified) {
            toast({
                title: 'Email Verification Required',
                description: 'Please verify your email address to add new buyers.',
                variant: 'destructive',
            });
        } else {
            setIsAddBuyerOpen(true);
        }
    };

    const renderTable = (buyers: Buyer[]) => {
        if (isAgencyLoading) return <p className="p-4 text-center">Loading buyers...</p>;
        if (buyers.length === 0) return <div className="text-center py-10 text-muted-foreground">No buyers found for the current filters.</div>;
        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Area &amp; Type</TableHead>
                        <TableHead>Budget &amp; Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {buyers.map(buyer => {
                        return (
                            <TableRow key={buyer.id}>
                                <TableCell onClick={() => handleDetailsClick(buyer)} className="cursor-pointer">
                                    <div className="font-bold font-headline text-base flex items-center gap-2">
                                        {buyer.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                        <Badge
                                            variant="default"
                                            className={cn(
                                            'font-mono',
                                            buyer.serial_no.startsWith('RB')
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 hover:bg-emerald-100/80'
                                                : 'bg-primary/20 text-primary hover:bg-primary/30'
                                            )}
                                        >
                                            {buyer.serial_no}
                                        </Badge>
                                        <span>{buyer.phone}</span>
                                    </div>
                                </TableCell>
                                <TableCell onClick={() => handleDetailsClick(buyer)} className="cursor-pointer">
                                    <div className="flex flex-col text-sm">
                                        <span>{buyer.area_preference}</span>
                                        <span className="text-muted-foreground">{buyer.property_type_preference}</span>
                                    </div>
                                </TableCell>
                                <TableCell onClick={() => handleDetailsClick(buyer)} className="cursor-pointer">
                                    <div className="flex flex-col text-sm">
                                        <span>{formatBudget(buyer.budget_min_amount, buyer.budget_min_unit, buyer.budget_max_amount, buyer.budget_max_unit)}</span>
                                        <span className="text-muted-foreground">{formatSize(buyer.size_min_value, buyer.size_min_unit, buyer.size_max_value, buyer.size_max_unit)}</span>
                                    </div>
                                </TableCell>
                                <TableCell onClick={() => handleDetailsClick(buyer)} className="cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={statusVariant[buyer.status as keyof typeof statusVariant]} className={buyer.status === 'Interested' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : buyer.status === 'New' ? 'bg-green-600 hover:bg-green-700 text-white' : buyer.status === 'Not Interested' ? 'bg-red-600 hover:bg-red-700 text-white' : buyer.status === 'Deal Closed' ? 'bg-slate-800 hover:bg-slate-900 text-white' : ''}>{buyer.status}</Badge>
                                        {buyer.is_investor && (<Badge className="bg-blue-600 hover:bg-blue-700 text-white">Investor</Badge>)}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost" className="rounded-full" onClick={(e) => e.stopPropagation()}>
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Toggle menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="glass-card">
                                            <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleDetailsClick(buyer); }}><Eye />View Details</DropdownMenuItem>
                                            {(profile.role !== 'Agent') && (<DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleEdit(buyer); }}><Edit />Edit Details</DropdownMenuItem>)}
                                            <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleSetAppointment(buyer); }}><CalendarPlus />Set Appointment</DropdownMenuItem>
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger><Bookmark />Change Status</DropdownMenuSubTrigger>
                                                <DropdownMenuPortal>
                                                    <DropdownMenuSubContent>
                                                        {buyerStatuses.map((status) => (
                                                            <DropdownMenuItem key={status} onSelect={(e) => { e.stopPropagation(); handleStatusChange(buyer, status); }} disabled={buyer.status === status}>{status}</DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                            {(profile.role !== 'Agent') && (<DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleDelete(buyer); }} className="text-destructive focus:text-destructive-foreground focus:bg-destructive"><Trash2 />Delete</DropdownMenuItem>)}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        );
    };

    const renderCards = (buyers: Buyer[]) => {
        if (isAgencyLoading) return <p className="p-4 text-center">Loading buyers...</p>;
        if (buyers.length === 0) return <div className="text-center py-10 text-muted-foreground">No buyers found for the current filters.</div>;
        return (
            <div className="space-y-4">
                {buyers.map(buyer => {
                    return (
                        <Card key={buyer.id} className="cursor-pointer">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-start">
                                    <div className="font-bold font-headline text-lg flex items-center gap-2">
                                        {buyer.name}
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge variant={statusVariant[buyer.status as keyof typeof statusVariant]} className={`capitalize ${buyer.status === 'Interested' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : buyer.status === 'New' ? 'bg-green-600 hover:bg-green-700 text-white' : buyer.status === 'Not Interested' ? 'bg-red-600 hover:bg-red-700 text-white' : buyer.status === 'Deal Closed' ? 'bg-slate-800 hover:bg-slate-900 text-white' : ''}`}>{buyer.status}</Badge>
                                        {buyer.is_investor && (<Badge className="bg-blue-600 hover:bg-blue-700 text-white">Investor</Badge>)}
                                    </div>
                                </CardTitle>
                                <div className="text-xs text-muted-foreground flex items-center gap-2 -mt-2 px-6">
                                     <Badge
                                        variant="default"
                                        className={cn(
                                        'font-mono',
                                        buyer.serial_no.startsWith('RB')
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 hover:bg-emerald-100/80'
                                            : 'bg-primary/20 text-primary hover:bg-primary/30'
                                        )}
                                    >
                                        {buyer.serial_no}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2"><Home className="h-4 w-4 text-muted-foreground" /><div><p className="text-muted-foreground">Area</p><p className="font-medium">{buyer.area_preference}</p></div></div>
                                <div className="flex items-center gap-2"><Ruler className="h-4 w-4 text-muted-foreground" /><div><p className="text-muted-foreground">Size</p><p className="font-medium">{formatSize(buyer.size_min_value, buyer.size_min_unit, buyer.size_max_value, buyer.size_max_unit)}</p></div></div>
                                <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-muted-foreground" /><div><p className="text-muted-foreground">Budget</p><p className="font-medium">{formatBudget(buyer.budget_min_amount, buyer.budget_min_unit, buyer.budget_max_amount, buyer.budget_max_unit)}</p></div></div>
                                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><div><p className="text-muted-foreground">Phone</p><p className="font-medium">{buyer.phone}</p></div></div>
                            </CardContent>
                            <CardFooter className="flex justify-end">
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost" className="rounded-full -mr-4 -mb-4" onClick={(e) => { e.stopPropagation(); }}>
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="bottom" className="w-full">
                                        <SheetHeader className="text-left mb-4">
                                            <SheetTitle>Actions for {buyer.serial_no}</SheetTitle>
                                        </SheetHeader>
                                        <div className="flex flex-col gap-2">
                                            <Button variant="outline" className="justify-start" onClick={(e) => { e.stopPropagation(); setSelectedBuyer(buyer); setIsDetailsOpen(true); }}><Eye />View Details</Button>
                                            {(profile.role !== 'Agent') && (<Button variant="outline" className="justify-start" onClick={(e) => { e.stopPropagation(); handleEdit(buyer); }}><Edit />Edit Details</Button>)}
                                            <Button variant="outline" className="justify-start" onClick={(e) => { e.stopPropagation(); handleSetAppointment(buyer); }}><CalendarPlus />Set Appointment</Button>
                                            
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" className="justify-start" onClick={(e) => e.stopPropagation()}><Bookmark />Change Status</Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                                                    {buyerStatuses.map((status) => (
                                                        <DropdownMenuItem key={status} onSelect={(e) => { e.stopPropagation(); handleStatusChange(buyer, status);}} disabled={buyer.status === status}>
                                                            {status}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                            {(profile.role !== 'Agent') && (
                                            <>
                                                <Separator />
                                                <Button variant="destructive" className="justify-start" onClick={(e) => { e.stopPropagation(); handleDelete(buyer); }}><Trash2 />Delete</Button>
                                            </>
                                            )}
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        );
    };

    const renderContent = (buyers: Buyer[]) => {
        return isMobile ? renderCards(buyers) : <Card><CardContent className="p-0">{renderTable(buyers)}</CardContent></Card>;
    };

    return (
        <>
            <TooltipProvider>
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className='hidden md:block'>
                            <h1 className="text-3xl font-bold tracking-tight font-headline">Buyers</h1>
                            <p className="text-muted-foreground">
                                Manage your buyer leads for sale and rent.
                            </p>
                        </div>
                        <div className="flex w-full md:w-auto items-center gap-2 flex-wrap">
                            {(profile.role === 'Admin' || profile.role === 'Editor') && (
                                <>
                                    <Popover open={isFilterPopoverOpen} onOpenChange={setIsFilterPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="rounded-full">
                                                <Filter className="mr-2 h-4 w-4" />Filters
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80">
                                            <div className="grid gap-4">
                                                <div className="space-y-2">
                                                    <h4 className="font-medium leading-none">Advanced Filters</h4>
                                                    <p className="text-sm text-muted-foreground">Refine your buyer search.</p>
                                                </div>
                                                <div className="grid gap-2">
                                                    
                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label htmlFor="area">Area</Label>
                                                        <Input id="area" value={filters.area} onChange={e => handleFilterChange('area', e.target.value)} className="col-span-2 h-8" />
                                                    </div>
                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label htmlFor="propertyType">Type</Label>
                                                        <Select value={filters.propertyType} onValueChange={(value: PropertyType | 'All') => handleFilterChange('propertyType', value)}>
                                                            <SelectTrigger className="col-span-2 h-8">
                                                                <SelectValue placeholder="Property Type" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="All">All</SelectItem>
                                                                <SelectItem value="House">House</SelectItem>
                                                                <SelectItem value="Plot">Plot</SelectItem>
                                                                <SelectItem value="Flat">Flat</SelectItem>
                                                                <SelectItem value="Shop">Shop</SelectItem>
                                                                <SelectItem value="Commercial">Commercial</SelectItem>
                                                                <SelectItem value="Agricultural">Agricultural</SelectItem>
                                                                <SelectItem value="Other">Other</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label>Budget</Label>
                                                        <div className="col-span-2 grid grid-cols-2 gap-2">
                                                            <Input id="minBudget" placeholder="Min" type="number" value={filters.minBudget} onChange={e => handleFilterChange('minBudget', e.target.value)} className="h-8" />
                                                            <Input id="maxBudget" placeholder="Max" type="number" value={filters.maxBudget} onChange={e => handleFilterChange('maxBudget', e.target.value)} className="h-8" />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label></Label>
                                                        <div className="col-span-2">
                                                            <Select value={filters.budgetUnit} onValueChange={(value: PriceUnit | 'All') => handleFilterChange('budgetUnit', value)}>
                                                                <SelectTrigger className="h-8">
                                                                    <SelectValue placeholder="Unit" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="All">All Units</SelectItem>
                                                                    <SelectItem value="Thousand">Thousand</SelectItem>
                                                                    <SelectItem value="Lacs">Lacs</SelectItem>
                                                                    <SelectItem value="Crore">Crore</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label>Size</Label>
                                                        <div className="col-span-2 grid grid-cols-2 gap-2">
                                                            <Input id="minSize" placeholder="Min" type="number" value={filters.minSize} onChange={e => handleFilterChange('minSize', e.target.value)} className="h-8" />
                                                            <Input id="maxSize" placeholder="Max" type="number" value={filters.maxSize} onChange={e => handleFilterChange('maxSize', e.target.value)} className="h-8" />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label></Label>
                                                        <div className="col-span-2">
                                                            <Select value={filters.sizeUnit} onValueChange={(value: SizeUnit | 'All') => handleFilterChange('sizeUnit', value)}>
                                                                <SelectTrigger className="h-8">
                                                                    <SelectValue placeholder="Unit" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="All">All Units</SelectItem>
                                                                    <SelectItem value="Marla">Marla</SelectItem>
                                                                    <SelectItem value="SqFt">SqFt</SelectItem>
                                                                    <SelectItem value="Kanal">Kanal</SelectItem>
                                                                    <SelectItem value="Acre">Acre</SelectItem>
                                                                    <SelectItem value="Maraba">Maraba</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" onClick={clearFilters}>Clear</Button>
                                                    <Button onClick={() => setIsFilterPopoverOpen(false)}>Apply</Button>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    <Button variant="outline" className="rounded-full"><Upload className="mr-2 h-4 w-4" />Import</Button>
                                    <Button variant="outline" className="rounded-full"><Download className="mr-2 h-4 w-4" />Export</Button>
                                </>
                            )}
                        </div>
                    </div>
                    
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <div className="flex items-center justify-between gap-4">
                            <TabsList>
                                <TabsTrigger value="For Sale">Sale Buyers</TabsTrigger>
                                <TabsTrigger value="For Rent">Rent Buyers</TabsTrigger>
                            </TabsList>
                            {isMobile && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="ml-auto">
                                            {activeStatusFilter}
                                            <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onSelect={() => setActiveStatusFilter('All')}>All</DropdownMenuItem>
                                        {buyerStatuses.map(status => (
                                            <DropdownMenuItem key={status} onSelect={() => setActiveStatusFilter(status)}>
                                                {status}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                        <TabsContent value="For Sale" className="mt-4">
                            {renderContent(filteredBuyers)}
                        </TabsContent>
                        <TabsContent value="For Rent" className="mt-4">
                            {renderContent(filteredBuyers)}
                        </TabsContent>
                    </Tabs>
                </div>
            </TooltipProvider>

            <div className={cn("fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 transition-opacity", isMoreMenuOpen && "opacity-0 pointer-events-none")}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button onClick={handleAddBuyerClick} className="rounded-full w-14 h-14 shadow-lg glowing-btn" size="icon">
                            <PlusCircle className="h-6 w-6" />
                            <span className="sr-only">Add Buyer</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Add Buyer</TooltipContent>
                </Tooltip>
            </div>

            <AddBuyerDialog
                isOpen={isAddBuyerOpen}
                setIsOpen={setIsAddBuyerOpen}
                totalSaleBuyers={totalSaleBuyers}
                totalRentBuyers={totalRentBuyers}
                buyerToEdit={buyerToEdit}
                onSave={handleSaveBuyer}
            />

            {buyerForFollowUp && (<AddFollowUpDialog isOpen={isFollowUpOpen} setIsOpen={setIsFollowUpOpen} buyer={buyerForFollowUp} existingFollowUp={buyerFollowUp} onSave={handleSaveFollowUp} />)}
            {appointmentDetails && (<SetAppointmentDialog isOpen={isAppointmentOpen} setIsOpen={setIsAppointmentOpen} onSave={handleSaveAppointment} appointmentDetails={appointmentDetails} />)}
            {selectedBuyer && (<BuyerDetailsDialog buyer={selectedBuyer} isOpen={isDetailsOpen} setIsOpen={setIsDetailsOpen} activeAgents={activeAgents} onAssign={handleAssignAgent} />)}

        </>
    );
}
