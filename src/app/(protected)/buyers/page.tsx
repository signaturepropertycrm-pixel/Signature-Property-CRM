
'use client';
import { AddBuyerDialog } from '@/components/add-buyer-dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { buyers as initialBuyers } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Edit, MoreHorizontal, PlusCircle, Trash2, Phone, Home, Search, Filter, Wallet } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { Buyer, BuyerStatus, PriceUnit } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';


const statusVariant = {
    'New': 'secondary',
    'Contacted': 'secondary',
    'Interested': 'default',
    'Not Interested': 'destructive',
    'Follow Up': 'secondary',
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

type FilterTab = 'All' | 'New' | 'Hot Lead' | 'Follow Up';

const buyerStatuses: BuyerStatus[] = [
    'New', 'Contacted', 'Interested', 'Not Interested', 'Follow Up',
    'Pending Response', 'Need More Info', 'Visited Property',
    'Deal Closed', 'Hot Lead', 'Cold Lead'
];

export default function BuyersPage() {
    const isMobile = useIsMobile();
    const [isAddBuyerOpen, setIsAddBuyerOpen] = useState(false);
    const [buyers, setBuyers] = useState<Buyer[]>(initialBuyers);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<FilterTab>('All');
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

        // Status tab filter
        if (activeTab !== 'All') {
            filtered = filtered.filter(b => b.status === activeTab);
        }
        
        // Search query filter
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(buyer => 
                buyer.name.toLowerCase().includes(lowercasedQuery) ||
                (buyer.area_preference && buyer.area_preference.toLowerCase().includes(lowercasedQuery)) ||
                buyer.serial_no.toLowerCase().includes(lowercasedQuery)
            );
        }

        // Advanced filters
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
    }, [searchQuery, activeTab, filters, buyers]);
    
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
                                            Change Status
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
                                        Change Status
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
            <p className="text-muted-foreground">Manage your buyer leads.</p>
          </div>
            <div className="flex w-full md:w-auto items-center gap-2 flex-wrap">
               <div className="relative w-full md:w-64">
                 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input 
                  placeholder="Search name, area, serial..." 
                  className="w-full pl-10 rounded-full bg-input/80" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
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
               <Button onClick={() => setIsAddBuyerOpen(true)} className="glowing-btn">
                  <PlusCircle />
                  Add Buyer
                </Button>
            </div>
        </div>
         <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FilterTab)}>
              <TabsList>
                  <TabsTrigger value="All">All</TabsTrigger>
                  <TabsTrigger value="New">New</TabsTrigger>
                  <TabsTrigger value="Hot Lead">Hot Leads</TabsTrigger>
                  <TabsTrigger value="Follow Up">Follow Up</TabsTrigger>
              </TabsList>
          </Tabs>
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
         <AddBuyerDialog isOpen={isAddBuyerOpen} setIsOpen={setIsAddBuyerOpen} totalBuyers={buyers.length} />
      </div>
    </>
  );
}

    