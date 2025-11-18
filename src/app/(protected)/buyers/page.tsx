
'use client';
import { AddBuyerDialog } from '@/components/add-buyer-dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { buyers as initialBuyers, buyerStatuses, followUps as initialFollowUps, appointments as initialAppointments } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Edit, MoreHorizontal, PlusCircle, Trash2, Phone, Home, Search, Filter, Wallet, Bookmark, Upload, Download, Ruler, Eye, CalendarPlus, UserCheck } from 'lucide-react';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { Buyer, BuyerStatus, PriceUnit, SizeUnit, PropertyType, AppointmentContactType, FollowUp, Appointment } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useSearch } from '../layout';
import { BuyerDetailsDialog } from '@/components/buyer-details-dialog';
import { SetAppointmentDialog } from '@/components/set-appointment-dialog';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatUnit } from '@/lib/formatters';
import { useCurrency } from '@/context/currency-context';
import { AddFollowUpDialog } from '@/components/add-follow-up-dialog';
import { useProfile } from '@/context/profile-context';


const statusVariant = {
    'New': 'default',
    'Contacted': 'secondary',
    'Interested': 'default',
    'Not Interested': 'destructive',
    'Follow Up': 'default',
    'Pending Response': 'secondary',
    'Need More Info': 'secondary',
    'Visited Property': 'secondary',
    'Deal Closed': 'default',
    'Hot Lead': 'default',
    'Cold Lead': 'secondary',
} as const;

function formatSize(minAmount?: number, minUnit?: SizeUnit, maxAmount?: number, maxUnit?: SizeUnit) {
    if (!minAmount || !minUnit) {
        return 'N/A';
    }
     if (!maxAmount || !maxUnit || (minAmount === maxAmount && minUnit === maxUnit)) {
        return `${minAmount} ${minUnit}`;
    }
    return `${minAmount} - ${maxAmount} ${maxUnit}`;
}


interface Filters {
  status: BuyerStatus | 'All';
  area: string;
  minBudget: string;
  maxBudget: string;
  budgetUnit: PriceUnit | 'All',
  propertyType: PropertyType | 'All';
  minSize: string;
  maxSize: string;
  sizeUnit: SizeUnit | 'All';
}

function BuyersPageContent() {
    const isMobile = useIsMobile();
    const router = useRouter();
    const pathname = usePathname();
    const { profile } = useProfile();
    const searchParams = useSearchParams();
    const { searchQuery } = useSearch();
    const { toast } = useToast();
    const { currency } = useCurrency();
    const statusFilterFromURL = searchParams.get('status') as BuyerStatus | 'All' | null;
    const activeTab = statusFilterFromURL || 'All';


    const [isAddBuyerOpen, setIsAddBuyerOpen] = useState(false);
    const [buyers, setBuyers] = useState<Buyer[]>([]);
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
    const [buyerToEdit, setBuyerToEdit] = useState<Buyer | null>(null);
    const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
    const [buyerForFollowUp, setBuyerForFollowUp] = useState<Buyer | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
    const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
    const [appointmentDetails, setAppointmentDetails] = useState<{ contactType: AppointmentContactType; contactName: string; contactSerialNo?: string; message: string; } | null>(null);
    const [filters, setFilters] = useState<Filters>({ status: 'All', area: '', minBudget: '', maxBudget: '', budgetUnit: 'All', propertyType: 'All', minSize: '', maxSize: '', sizeUnit: 'All' });


    const loadData = () => {
        const savedBuyers = localStorage.getItem('buyers');
        setBuyers(savedBuyers ? JSON.parse(savedBuyers) : initialBuyers);

        const savedFollowUps = localStorage.getItem('followUps');
        setFollowUps(savedFollowUps ? JSON.parse(savedFollowUps) : initialFollowUps);
    };

    useEffect(() => {
        loadData();
        
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'buyers' || event.key === 'followUps') {
                loadData();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    useEffect(() => {
        if (buyers.length > 0) localStorage.setItem('buyers', JSON.stringify(buyers));
    }, [buyers]);
    
    useEffect(() => {
        localStorage.setItem('followUps', JSON.stringify(followUps));
    }, [followUps]);

    useEffect(() => {
        if (!isAddBuyerOpen) {
            setBuyerToEdit(null);
        }
    }, [isAddBuyerOpen]);

    const formatBudget = (minAmount?: number, minUnit?: PriceUnit, maxAmount?: number, maxUnit?: PriceUnit) => {
        if (!minAmount || !minUnit) {
            return 'N/A';
        }
        const minVal = formatUnit(minAmount, minUnit);

        if (!maxAmount || !maxUnit || (minAmount === maxAmount && minUnit === maxUnit)) {
            return formatCurrency(minVal, currency);
        }
        const maxVal = formatUnit(maxAmount, maxUnit);
        return `${formatCurrency(minVal, currency)} - ${formatCurrency(maxVal, currency)}`;
    };

    const handleEdit = (buyer: Buyer) => {
        setBuyerToEdit(buyer);
        setIsAddBuyerOpen(true);
    };

    const handleDetailsClick = (buyer: Buyer) => {
        setSelectedBuyer(buyer);
        setIsDetailsOpen(true);
    }

     const handleSetAppointment = (buyer: Buyer) => {
        setAppointmentDetails({
            contactType: 'Buyer',
            contactName: buyer.name,
            contactSerialNo: buyer.serial_no,
            message: `Regarding buyer's interest in ${buyer.area_preference || 'general properties'}.`, 
        });
        setIsAppointmentOpen(true);
    };

    const handleSaveAppointment = (appointment: Appointment) => {
        const savedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        localStorage.setItem('appointments', JSON.stringify([appointment, ...savedAppointments]));
    };
    
    const handleDelete = (buyerId: string) => {
        setBuyers(prev => prev.map(b => b.id === buyerId ? { ...b, is_deleted: true } : b));
        toast({
            title: "Buyer Moved to Trash",
            description: "You can restore them from the trash page.",
        });
    };

    const handleFilterChange = (key: keyof Filters, value: string | BuyerStatus | PropertyType | PriceUnit | SizeUnit) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({ status: 'All', area: '', minBudget: '', maxBudget: '', budgetUnit: 'All', propertyType: 'All', minSize: '', maxSize: '', sizeUnit: 'All' });
        setIsFilterPopoverOpen(false);
    };

    const handleStatusChange = (buyerId: string, newStatus: BuyerStatus) => {
        const buyerToUpdate = buyers.find(b => b.id === buyerId);
        if (!buyerToUpdate) return;
        
        if (newStatus === 'Follow Up') {
            setBuyerForFollowUp(buyerToUpdate);
            setIsFollowUpOpen(true);
        } else {
            const updatedBuyers = buyers.map(buyer => 
                buyer.id === buyerId ? { ...buyer, status: newStatus } : buyer
            );
            setBuyers(updatedBuyers);

            // If status changed from 'Follow Up', remove from followUps
            if (buyerToUpdate.status === 'Follow Up') {
                const updatedFollowUps = followUps.filter(fu => fu.buyerId !== buyerId);
                setFollowUps(updatedFollowUps);
            }
        }
    };
    
     const handleSaveFollowUp = (buyerId: string, notes: string, nextReminder: string) => {
        const buyer = buyers.find(b => b.id === buyerId);
        if (!buyer) return;

        const newFollowUp: FollowUp = {
            id: `FU-${Date.now()}`,
            buyerId: buyer.id,
            buyerName: buyer.name,
            buyerPhone: buyer.phone,
            propertyInterest: buyer.area_preference || 'General',
            lastContactDate: new Date().toISOString(),
            nextReminder: nextReminder,
            status: 'Scheduled',
            notes: notes,
        };
        
        // This is the critical fix: update the follow-ups state
        setFollowUps(prevFollowUps => [...prevFollowUps.filter(fu => fu.buyerId !== buyerId), newFollowUp]);
        
        setBuyers(prev => prev.map(b => b.id === buyerId ? { ...b, status: 'Follow Up', last_follow_up_note: notes } : b));
        
        toast({
            title: "Follow-up Scheduled",
            description: `A follow-up has been created for ${buyer.name}.`
        });

        setIsFollowUpOpen(false);
        setBuyerForFollowUp(null);
    };


     const handleSaveBuyer = (buyerData: Buyer) => {
        if (buyerToEdit) {
            // Update existing buyer
            setBuyers(buyers.map(b => b.id === buyerData.id ? buyerData : b));
        } else {
            // Add new buyer
            setBuyers([...buyers, buyerData]);
        }
        setBuyerToEdit(null);
    };

    const filteredBuyers = useMemo(() => {
        let filtered = buyers.filter(b => !b.is_deleted);

        // Status filter from URL (Sidebar or Mobile Tabs)
        if (activeTab && activeTab !== 'All') {
            filtered = filtered.filter(b => b.status === activeTab);
        }
        
        // Global search query from header
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(buyer => 
                buyer.name.toLowerCase().includes(lowercasedQuery) ||
                (buyer.area_preference && buyer.area_preference.toLowerCase().includes(lowercasedQuery)) ||
                buyer.serial_no.toLowerCase().includes(lowercasedQuery)
            );
        }

        // Advanced filters from popover
        if (filters.status !== 'All') {
            filtered = filtered.filter(b => b.status === filters.status);
        }
        if (filters.area) {
            filtered = filtered.filter(b => b.area_preference && b.area_preference.toLowerCase().includes(filters.area.toLowerCase()));
        }
        if (filters.minBudget) {
             filtered = filtered.filter(b => b.budget_min_amount && b.budget_min_amount >= Number(filters.minBudget) && (filters.budgetUnit === 'All' || b.budget_min_unit === filters.budgetUnit));
        }
        if (filters.maxBudget) {
             filtered = filtered.filter(b => b.budget_max_amount && b.budget_max_amount <= Number(filters.maxBudget) && (filters.budgetUnit === 'All' || b.budget_max_unit === filters.budgetUnit));
        }
         if (filters.propertyType !== 'All') {
            filtered = filtered.filter(p => p.property_type_preference === filters.propertyType);
        }
        if (filters.minSize) {
            filtered = filtered.filter(p => p.size_min_value && p.size_min_value >= Number(filters.minSize) && (filters.sizeUnit === 'All' || p.size_min_unit === filters.sizeUnit));
        }
        if (filters.maxSize) {
            filtered = filtered.filter(p => p.size_max_value && p.size_max_value <= Number(filters.maxSize) && (filters.sizeUnit === 'All' || p.size_max_unit === filters.sizeUnit));
        }


        return filtered;
    }, [searchQuery, activeTab, filters, buyers]);

    const handleTabChange = (value: string) => {
        const status = value as BuyerStatus | 'All';
        const url = status === 'All' ? pathname : `${pathname}?status=${status}`;
        router.push(url);
    };
    
    const renderTable = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Area & Type</TableHead>
                    <TableHead>Budget & Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredBuyers.map(buyer => (
                    <TableRow key={buyer.id} className="cursor-pointer" onClick={() => handleDetailsClick(buyer)}>
                        <TableCell>
                            <div className="font-medium">{buyer.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="default" className="font-mono bg-primary/20 text-primary hover:bg-primary/30">{buyer.serial_no}</Badge>
                                <span>{buyer.phone}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col text-sm">
                                <span>{buyer.area_preference}</span>
                                <span className="text-muted-foreground">{buyer.property_type_preference}</span>
                            </div>
                        </TableCell>
                         <TableCell>
                            <div className="flex flex-col text-sm">
                                <span>{formatBudget(buyer.budget_min_amount, buyer.budget_min_unit, buyer.budget_max_amount, buyer.budget_max_unit)}</span>
                                <span className="text-muted-foreground">{formatSize(buyer.size_min_value, buyer.size_min_unit, buyer.size_max_value, buyer.size_max_unit)}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Badge 
                                    variant={statusVariant[buyer.status]} 
                                    className={
                                        buyer.status === 'Interested' || buyer.status === 'Hot Lead' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 
                                        buyer.status === 'New' ? 'bg-green-600 hover:bg-green-700 text-white' :
                                        buyer.status === 'Not Interested' ? 'bg-red-600 hover:bg-red-700 text-white' :
                                        buyer.status === 'Deal Closed' ? 'bg-slate-800 hover:bg-slate-900 text-white' : ''
                                    }
                                >
                                    {buyer.status}
                                </Badge>
                                {buyer.is_investor && (
                                     <Badge className="bg-blue-600 hover:bg-blue-700 text-white">Investor</Badge>
                                )}
                            </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost" className="rounded-full">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="glass-card">
                                    <DropdownMenuItem onSelect={() => handleDetailsClick(buyer)}>
                                        <Eye />
                                        View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleEdit(buyer)}>
                                        <Edit />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleSetAppointment(buyer)}>
                                        <CalendarPlus />
                                        Set Appointment
                                    </DropdownMenuItem>
                                     <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                            <Bookmark />
                                            Status
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuSubContent>
                                                {buyerStatuses.map((status) => (
                                                    <DropdownMenuItem 
                                                        key={status} 
                                                        onClick={() => handleStatusChange(buyer.id, status)}
                                                        disabled={buyer.status === status}
                                                    >
                                                        {status}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuSubContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenuSub>
                                    <DropdownMenuItem onSelect={() => handleDelete(buyer.id)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                                        <Trash2 />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

    const renderCards = () => (
        <div className="space-y-4">
            {filteredBuyers.map(buyer => (
                <Card key={buyer.id} onClick={() => handleDetailsClick(buyer)}>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-start">
                            <div>
                                <span className="font-medium text-lg">{buyer.name}</span>
                                <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1 flex-wrap">
                                    <Badge variant="default" className="font-mono bg-primary/20 text-primary hover:bg-primary/30">{buyer.serial_no}</Badge>
                                </div>
                            </div>
                           <div className="flex flex-col items-end gap-2">
                                <Badge 
                                    variant={statusVariant[buyer.status]} 
                                    className={
                                        `capitalize ${buyer.status === 'Interested' || buyer.status === 'Hot Lead' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 
                                        buyer.status === 'New' ? 'bg-green-600 hover:bg-green-700 text-white' :
                                        buyer.status === 'Not Interested' ? 'bg-red-600 hover:bg-red-700 text-white' :
                                        buyer.status === 'Deal Closed' ? 'bg-slate-800 hover:bg-slate-900 text-white' : ''}`
                                    }
                                >
                                    {buyer.status}
                                </Badge>
                                {buyer.is_investor && (
                                     <Badge className="bg-blue-600 hover:bg-blue-700 text-white">Investor</Badge>
                                )}
                           </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                           <Home className="h-4 w-4 text-muted-foreground" />
                           <div>
                                <p className="text-muted-foreground">Area</p>
                                <p className="font-medium">{buyer.area_preference}</p>
                           </div>
                        </div>
                         <div className="flex items-center gap-2">
                           <Ruler className="h-4 w-4 text-muted-foreground" />
                           <div>
                                <p className="text-muted-foreground">Size</p>
                                <p className="font-medium">{formatSize(buyer.size_min_value, buyer.size_min_unit, buyer.size_max_value, buyer.size_max_unit)}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <Wallet className="h-4 w-4 text-muted-foreground" />
                           <div>
                                <p className="text-muted-foreground">Budget</p>
                                <p className="font-medium">{formatBudget(buyer.budget_min_amount, buyer.budget_min_unit, buyer.budget_max_amount, buyer.budget_max_unit)}</p>
                           </div>
                        </div>
                         <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-muted-foreground">Phone</p>
                                <p className="font-medium">{buyer.phone}</p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" className="rounded-full -mr-4 -mb-4" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass-card">
                                <DropdownMenuItem onSelect={() => handleDetailsClick(buyer)}>
                                    <Eye />
                                    View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleEdit(buyer)}>
                                    <Edit />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleSetAppointment(buyer)}>
                                    <CalendarPlus />
                                    Set Appointment
                                </DropdownMenuItem>
                                 <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        <Bookmark />
                                        Status
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuPortal>
                                        <DropdownMenuSubContent>
                                            {buyerStatuses.map((status) => (
                                                <DropdownMenuItem 
                                                    key={status} 
                                                    onClick={() => handleStatusChange(buyer.id, status)}
                                                    disabled={buyer.status === status}
                                                >
                                                    {status}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuSubContent>
                                    </DropdownMenuPortal>
                                </DropdownMenuSub>
                                <DropdownMenuItem onSelect={() => handleDelete(buyer.id)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                                    <Trash2 />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className='hidden md:block'>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Buyers</h1>
            <p className="text-muted-foreground">
                {activeTab !== 'All' ? `Filtering by status: ${activeTab}` : 'Manage your buyer leads.'}
            </p>
          </div>
            <div className="flex w-full md:w-auto items-center gap-2 flex-wrap">
                <Popover open={isFilterPopoverOpen} onOpenChange={setIsFilterPopoverOpen}>
                    <PopoverTrigger asChild>
                    <Button variant="outline" className="rounded-full">
                        <Filter className="mr-2 h-4 w-4" />
                        Filters
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                        <h4 className="font-medium leading-none">Filters</h4>
                        <p className="text-sm text-muted-foreground">
                            Refine your buyer search.
                        </p>
                        </div>
                        <div className="grid gap-2">
                         <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="status">Status</Label>
                            <Select value={filters.status} onValueChange={(value: BuyerStatus | 'All') => handleFilterChange('status', value)}>
                                <SelectTrigger className="col-span-2 h-8">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All</SelectItem>
                                    {buyerStatuses.map(status => (
                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
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
               <Button variant="outline" className="rounded-full">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button variant="outline" className="rounded-full">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
        </div>
        
        {isMobile ? (
            <div className="w-full">
                <Select value={activeTab} onValueChange={handleTabChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by status..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Statuses</SelectItem>
                         {buyerStatuses.map((status) => (
                           <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        ) : null}
        
        <Card className="md:block hidden">
            <CardContent className="p-0">
                {renderTable()}
            </CardContent>
        </Card>
         <div className="md:hidden">
            {renderCards()}
        </div>
      </div>

      {pathname.startsWith('/buyers') && (profile.role === 'Admin' || profile.role === 'Editor') && (
        <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-50">
           <Button onClick={() => setIsAddBuyerOpen(true)} className="rounded-full w-14 h-14 shadow-lg glowing-btn" size="icon">
                <PlusCircle className="h-6 w-6" />
                <span className="sr-only">Add Buyer</span>
            </Button>
        </div>
      )}
      
       <AddBuyerDialog 
          isOpen={isAddBuyerOpen} 
          setIsOpen={setIsAddBuyerOpen} 
          totalBuyers={buyers.length}
          buyerToEdit={buyerToEdit}
          onSave={handleSaveBuyer}
       />
        
        {buyerForFollowUp && (
            <AddFollowUpDialog
                isOpen={isFollowUpOpen}
                setIsOpen={setIsFollowUpOpen}
                buyer={buyerForFollowUp}
                onSave={handleSaveFollowUp}
            />
        )}


        {appointmentDetails && (
            <SetAppointmentDialog 
                isOpen={isAppointmentOpen}
                setIsOpen={setIsAppointmentOpen}
                onSave={handleSaveAppointment}
                appointmentDetails={appointmentDetails}
            />
        )}

        {selectedBuyer && (
            <BuyerDetailsDialog
                buyer={selectedBuyer}
                isOpen={isDetailsOpen}
                setIsOpen={setIsDetailsOpen}
            />
        )}
    </>
  );
}

export default function BuyersPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BuyersPageContent />
        </Suspense>
    );
}

    

    

    


    