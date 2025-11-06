
'use client';
import { AddBuyerDialog } from '@/components/add-buyer-dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { buyers as initialBuyers, buyerStatuses } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Edit, MoreHorizontal, PlusCircle, Trash2, Phone, Home, Search, Filter, Wallet, Bookmark, Upload, Download } from 'lucide-react';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { Buyer, BuyerStatus, PriceUnit } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams } from 'next/navigation';
import { useSearch } from '../layout';


const statusVariant = {
    'New': 'secondary',
    'Contacted': 'secondary',
    'Interested': 'default',
    'Not Interested': 'destructive',
    'Follow Up': 'default',
    'Pending Response': 'secondary',
    'Need More Info': 'secondary',
    'Visited Property': 'secondary',
    'Deal Closed': 'default',
    'Hot Lead': 'default',
    'Cold Lead': 'secondary'
} as const;

function formatBudget(minAmount?: number, minUnit?: PriceUnit, maxAmount?: number, maxUnit?: PriceUnit) {
    if (!minAmount || !minUnit || !maxAmount || !maxUnit) {
        return 'N/A';
    }
    return `${minAmount} ${minUnit} - ${maxAmount} ${maxUnit}`;
}


interface Filters {
  name: string;
  status: BuyerStatus | 'All';
  area: string;
}

function BuyersPageContent() {
    const isMobile = useIsMobile();
    const searchParams = useSearchParams();
    const { searchQuery } = useSearch();
    const statusFilterFromURL = searchParams.get('status') as BuyerStatus | null;

    const [isAddBuyerOpen, setIsAddBuyerOpen] = useState(false);
    const [buyers, setBuyers] = useState<Buyer[]>(initialBuyers);
    const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
    const [filters, setFilters] = useState<Filters>({
        name: '',
        status: 'All',
        area: '',
    });

    const handleFilterChange = (key: keyof Filters, value: string | BuyerStatus) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({ name: '', status: 'All', area: '' });
        setIsFilterPopoverOpen(false);
    };

    const handleStatusChange = (buyerId: string, newStatus: BuyerStatus) => {
        setBuyers(prevBuyers => 
            prevBuyers.map(buyer => 
                buyer.id === buyerId ? { ...buyer, status: newStatus } : buyer
            )
        );
    };

    const filteredBuyers = useMemo(() => {
        let filtered = buyers;

        // Status filter from URL (Sidebar)
        if (statusFilterFromURL) {
            filtered = filtered.filter(b => b.status === statusFilterFromURL);
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
        if (filters.name) {
            filtered = filtered.filter(b => b.name.toLowerCase().includes(filters.name.toLowerCase()));
        }
        if (filters.status !== 'All') {
            filtered = filtered.filter(b => b.status === filters.status);
        }
        if (filters.area) {
            filtered = filtered.filter(b => b.area_preference && b.area_preference.toLowerCase().includes(filters.area.toLowerCase()));
        }

        return filtered;
    }, [searchQuery, statusFilterFromURL, filters, buyers]);
    
    const renderTable = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Areas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredBuyers.map(buyer => (
                    <TableRow key={buyer.id}>
                        <TableCell>
                            <div className="font-medium">{buyer.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                <Badge variant="default" className="font-mono bg-primary/20 text-primary hover:bg-primary/30">{buyer.serial_no}</Badge>
                                <span>{buyer.phone}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            {formatBudget(buyer.budget_min_amount, buyer.budget_min_unit, buyer.budget_max_amount, buyer.budget_max_unit)}
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col text-sm">
                                <span>{buyer.area_preference}</span>
                                <span className="text-muted-foreground">{buyer.property_type_preference}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                           <Badge 
                                variant={statusVariant[buyer.status] || 'default'} 
                                className={
                                    buyer.status === 'Interested' || buyer.status === 'Hot Lead' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 
                                    buyer.status === 'Not Interested' ? 'bg-red-600 hover:bg-red-700 text-white' :
                                    buyer.status === 'Deal Closed' ? 'bg-slate-800 hover:bg-slate-900 text-white' : ''
                                }
                            >
                                {buyer.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost" className="rounded-full">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="glass-card">
                                    <DropdownMenuItem>
                                        <Edit />
                                        Edit
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
                                    <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
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
                <Card key={buyer.id}>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-start">
                            <div>
                                <span className="font-medium text-lg">{buyer.name}</span>
                                <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                    <Badge variant="default" className="font-mono bg-primary/20 text-primary hover:bg-primary/30">{buyer.serial_no}</Badge>
                                </div>
                            </div>
                            <Badge 
                                variant={statusVariant[buyer.status] || 'default'} 
                                className={
                                    buyer.status === 'Interested' || buyer.status === 'Hot Lead' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 
                                    buyer.status === 'Not Interested' ? 'bg-red-600 hover:bg-red-700 text-white' :
                                    buyer.status === 'Deal Closed' ? 'bg-slate-800 hover:bg-slate-900 text-white' : ''
                                }
                            >
                                {buyer.status}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-muted-foreground">Phone</p>
                                <p className="font-medium">{buyer.phone}</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-2">
                           <Home className="h-4 w-4 text-muted-foreground" />
                           <div>
                                <p className="text-muted-foreground">Area</p>
                                <p className="font-medium">{buyer.area_preference}</p>
                           </div>
                        </div>
                         <div className="flex items-center gap-2 col-span-2">
                           <Wallet className="h-4 w-4 text-muted-foreground" />
                           <div>
                                <p className="text-muted-foreground">Budget</p>
                                <p className="font-medium">{formatBudget(buyer.budget_min_amount, buyer.budget_min_unit, buyer.budget_max_amount, buyer.budget_max_unit)}</p>
                           </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" className="rounded-full -mr-4 -mb-4">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass-card">
                                <DropdownMenuItem>
                                    <Edit />
                                    Edit
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
                                <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
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
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Buyers</h1>
            <p className="text-muted-foreground">
                {statusFilterFromURL ? `Filtering by status: ${statusFilterFromURL}` : 'Manage your buyer leads.'}
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
        <Card className="md:block hidden">
            <CardContent className="p-0">
                {renderTable()}
            </CardContent>
        </Card>
         <div className="md:hidden">
            {renderCards()}
        </div>
      </div>
      <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-50">
         <Button onClick={() => setIsAddBuyerOpen(true)} className="rounded-full w-14 h-14 shadow-lg glowing-btn" size="icon">
              <PlusCircle className="h-6 w-6" />
              <span className="sr-only">Add Buyer</span>
          </Button>
         <AddBuyerDialog isOpen={isAddBuyerOpen} setIsOpen={setIsAddBuyerOpen} totalBuyers={buyers.length} />
      </div>
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

    
    