
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Trash2,
  Edit,
  Video,
  CheckCircle,
  Eye,
  Filter,
  Upload,
  Download,
  Search,
  MapPin,
  Tag,
  Wallet,
  VideoOff,
  PlusCircle,
  CalendarPlus,
  Briefcase,
  Home,
  Building,
} from 'lucide-react';
import { AddPropertyDialog } from '@/components/add-property-dialog';
import { Input } from '@/components/ui/input';
import type { Property, PropertyType, SizeUnit, PriceUnit, AppointmentContactType, Appointment } from '@/lib/types';
import { useState, useMemo, useEffect } from 'react';
import { PropertyDetailsDialog } from '@/components/property-details-dialog';
import { MarkAsSoldDialog } from '@/components/mark-as-sold-dialog';
import { RecordVideoDialog } from '@/components/record-video-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSearch, useUI } from '../layout';
import { SetAppointmentDialog } from '@/components/set-appointment-dialog';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/context/currency-context';
import { formatCurrency, formatUnit } from '@/lib/formatters';
import { useProfile } from '@/context/profile-context';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/hooks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

function formatSize(value: number, unit: string) {
  return `${value} ${unit}`;
}

interface Filters {
  area: string;
  propertyType: PropertyType | 'All';
  minSize: string;
  maxSize: string;
  sizeUnit: SizeUnit | 'All';
  minDemand: string;
  maxDemand: string;
  demandUnit: PriceUnit | 'All';
}

type FilterTab = 'All' | 'Available' | 'Sold' | 'Recorded' | 'For Rent';

const propertyStatusLinks: { label: string; status: FilterTab }[] = [
  { label: 'All Properties', status: 'All' },
  { label: 'Available', status: 'Available' },
  { label: 'Rental', status: 'For Rent' },
  { label: 'Sold', status: 'Sold' },
  { label: 'Recorded', status: 'Recorded' },
];

export default function PropertiesPage() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { profile } = useProfile();
  const { searchQuery } = useSearch();
  const { isMoreMenuOpen } = useUI();
  const statusFilterFromURL = searchParams.get('status') as FilterTab | 'All' | null;
  const activeTab = statusFilterFromURL || 'All';
  const { toast } = useToast();
  const { currency } = useCurrency();
  const firestore = useFirestore();

  const agencyPropertiesQuery = useMemoFirebase(
    () => (profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'properties') : null),
    [profile.agency_id, firestore]
  );
  const agentPropertiesQuery = useMemoFirebase(
    () => (profile.user_id ? collection(firestore, 'agents', profile.user_id, 'properties') : null),
    [profile.user_id, firestore]
  );

  const { data: agencyProperties, isLoading: isAgencyLoading } = useCollection<Property>(agencyPropertiesQuery);
  const { data: agentProperties, isLoading: isAgentLoading } = useCollection<Property>(agentPropertiesQuery);

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSoldOpen, setIsSoldOpen] = useState(false);
  const [isRecordVideoOpen, setIsRecordVideoOpen] = useState(false);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState<{
    contactType: AppointmentContactType;
    contactName: string;
    contactSerialNo?: string;
    message: string;
  } | null>(null);
  const [propertyToEdit, setPropertyToEdit] = useState<Property | null>(null);
  const [filters, setFilters] = useState<Filters>({
    area: '',
    propertyType: 'All',
    minSize: '',
    maxSize: '',
    sizeUnit: 'All',
    minDemand: '',
    maxDemand: '',
    demandUnit: 'All',
  });
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [isAddPopoverOpen, setIsAddPopoverOpen] = useState(false);

  const allProperties = useMemo(() => {
    const combined = [...(agencyProperties || []), ...(agentProperties || [])];
    return Array.from(new Map(combined.map((p) => [p.id, p])).values());
  }, [agencyProperties, agentProperties]);

  useEffect(() => {
    if (!isAddPropertyOpen) {
      setPropertyToEdit(null);
    }
  }, [isAddPropertyOpen]);

  const formatDemand = (amount: number, unit: PriceUnit) => {
    const valueInPkr = formatUnit(amount, unit);
    return formatCurrency(valueInPkr, currency);
  };

  const handleFilterChange = (key: keyof Filters, value: string | PropertyType | SizeUnit | PriceUnit) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      area: '',
      propertyType: 'All',
      minSize: '',
      maxSize: '',
      sizeUnit: 'All',
      minDemand: '',
      maxDemand: '',
      demandUnit: 'All',
    });
    setIsFilterPopoverOpen(false);
  };

  const getFilteredProperties = (properties: Property[] | null) => {
    if (!properties) return [];
    let filtered = properties.filter((p) => !p.is_deleted);

    if (activeTab && (activeTab === 'Available' || activeTab === 'Sold')) {
      filtered = filtered.filter((p) => p.status === activeTab);
    } else if (activeTab === 'Recorded') {
      filtered = filtered.filter((p) => p.is_recorded);
    } else if (activeTab === 'For Rent') {
      filtered = filtered.filter((p) => p.potential_rent_amount && p.potential_rent_amount > 0 && p.status === 'Available');
    }

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (prop) =>
          prop.auto_title.toLowerCase().includes(lowercasedQuery) ||
          prop.address.toLowerCase().includes(lowercasedQuery) ||
          prop.area.toLowerCase().includes(lowercasedQuery) ||
          prop.serial_no.toLowerCase().includes(lowercasedQuery)
      );
    }

    if (filters.area) filtered = filtered.filter((p) => p.area.toLowerCase().includes(filters.area.toLowerCase()));
    if (filters.propertyType !== 'All') filtered = filtered.filter((p) => p.property_type === filters.propertyType);
    if (filters.minSize) filtered = filtered.filter((p) => p.size_value >= Number(filters.minSize) && (filters.sizeUnit === 'All' || p.size_unit === filters.sizeUnit));
    if (filters.maxSize) filtered = filtered.filter((p) => p.size_value <= Number(filters.maxSize) && (filters.sizeUnit === 'All' || p.size_unit === filters.sizeUnit));
    if (filters.minDemand) filtered = filtered.filter((p) => p.demand_amount >= Number(filters.minDemand) && (filters.demandUnit === 'All' || p.demand_unit === filters.demandUnit));
    if (filters.maxDemand) filtered = filtered.filter((p) => p.demand_amount <= Number(filters.maxDemand) && (filters.demandUnit === 'All' || p.demand_unit === filters.demandUnit));

    return filtered;
  };

  const filteredAgentProperties = useMemo(() => getFilteredProperties(agentProperties), [searchQuery, filters, activeTab, agentProperties]);
  const filteredAgencyProperties = useMemo(() => getFilteredProperties(agencyProperties), [searchQuery, filters, activeTab, agencyProperties]);

  const handleRowClick = (prop: Property) => {
    setSelectedProperty(prop);
    setIsDetailsOpen(true);
  };

  const handleMarkAsSold = (prop: Property) => {
    setSelectedProperty(prop);
    setIsSoldOpen(true);
  };

  const handleRecordVideo = (prop: Property) => {
    setSelectedProperty(prop);
    setIsRecordVideoOpen(true);
  };

  const handleEdit = (prop: Property) => {
    setPropertyToEdit(prop);
    setIsAddPropertyOpen(true);
  };

  const handleSetAppointment = (prop: Property) => {
    setAppointmentDetails({
      contactType: 'Owner',
      contactName: `Owner of ${prop.serial_no}`,
      contactSerialNo: prop.serial_no,
      message: `Regarding property: ${prop.auto_title} (${prop.address})`,
    });
    setIsAppointmentOpen(true);
  };

  const handleSaveAppointment = async (appointment: Appointment) => {
    if (!profile.agency_id) return;
    const collectionRef = collection(firestore, 'agencies', profile.agency_id, 'appointments');
    await addDoc(collectionRef, appointment);
  };

  const getPropertyCollectionInfo = (property: Property) => {
    const isAgentOwned = profile.role === 'Agent' && property.created_by === profile.user_id;
    const collectionName = isAgentOwned ? 'agents' : 'agencies';
    const collectionId = isAgentOwned ? profile.user_id : profile.agency_id;
    return { collectionName, collectionId };
  };

  const handleUnmarkRecorded = async (prop: Property) => {
    const { collectionName, collectionId } = getPropertyCollectionInfo(prop);
    if (!collectionId) return;

    const docRef = doc(firestore, collectionName, collectionId, 'properties', prop.id);
    await setDoc(docRef, { is_recorded: false, video_links: {} }, { merge: true });
  };

  const handleUpdateProperty = async (updatedProperty: Property) => {
    const { collectionName, collectionId } = getPropertyCollectionInfo(updatedProperty);
    if (!collectionId) return;

    const docRef = doc(firestore, collectionName, collectionId, 'properties', updatedProperty.id);
    await setDoc(docRef, updatedProperty, { merge: true });
  };

  const handleDelete = async (property: Property) => {
    const { collectionName, collectionId } = getPropertyCollectionInfo(property);
    if (!collectionId) return;

    const docRef = doc(firestore, collectionName, collectionId, 'properties', property.id);
    await setDoc(docRef, { is_deleted: true }, { merge: true });
    toast({
      title: 'Property Moved to Trash',
      description: 'You can restore it from the trash page.',
    });
  };

  const handleSaveProperty = async (propertyData: Omit<Property, 'id'> & { id?: string }) => {
    const isAgentAdding = profile.role === 'Agent';
    
    if (propertyToEdit && propertyData.id) {
        // When editing, determine the correct collection based on the original property's creator
        const { collectionName, collectionId } = getPropertyCollectionInfo(propertyToEdit);
        if (!collectionId) return;

        const docRef = doc(firestore, collectionName, collectionId, 'properties', propertyData.id);
        await setDoc(docRef, propertyData, { merge: true });
        toast({ title: 'Property Updated' });
    } else {
        // When adding a new property
        const collectionName = isAgentAdding ? 'agents' : 'agencies';
        const collectionId = isAgentAdding ? profile.user_id : profile.agency_id;
        
        if (!collectionId) return;
        
        const collectionRef = collection(firestore, collectionName, collectionId, 'properties');
        const { id, ...restOfData } = propertyData;
        
        await addDoc(collectionRef, { 
            ...restOfData,
            created_by: profile.user_id, // Ensure created_by is set correctly
            agency_id: profile.agency_id // Ensure agency_id is always present
        });
        toast({ title: 'Property Added' });
    }
    setPropertyToEdit(null);
};


  const handleTabChange = (value: string) => {
    const status = value as FilterTab;
    const url = status === 'All' ? pathname : `${pathname}?status=${status}`;
    router.push(url);
  };

  const renderTable = (properties: Property[], isAgentData: boolean) => {
    if (isAgentLoading || isAgencyLoading) return <p className="p-4 text-center">Loading properties...</p>;
    if (properties.length === 0) return <div className="text-center py-10 text-muted-foreground">No properties found for the current filters.</div>;
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[350px]">Property</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Demand</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {properties.map((prop) => (
            <TableRow key={prop.id} className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => handleRowClick(prop)}>
              <TableCell>
                <div className="flex items-center gap-2">
                <span className="font-bold font-headline text-base">
                  {prop.auto_title || `${prop.size_value} ${prop.size_unit} ${prop.property_type} in ${prop.area}`}
                </span>
                  {prop.is_recorded && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Video className="h-4 w-4 text-primary" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Video is recorded</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                  <Badge variant="default" className="font-mono bg-primary/20 text-primary hover:bg-primary/30">{prop.serial_no}</Badge>
                  <span className="truncate max-w-48">{prop.address}</span>
                </div>
              </TableCell>
              <TableCell>{prop.property_type}</TableCell>
              <TableCell>{formatSize(prop.size_value, prop.size_unit)}</TableCell>
              <TableCell>{formatDemand(prop.demand_amount, prop.demand_unit)}</TableCell>
              <TableCell>
                <Badge className={prop.status === 'Sold' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-primary text-primary-foreground'}>
                  {prop.status}
                </Badge>
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
                    <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleRowClick(prop); }}><Eye />View Details</DropdownMenuItem>
                    <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleSetAppointment(prop); }}><CalendarPlus />Set Appointment</DropdownMenuItem>
                    {(isAgentData || profile.role !== 'Agent') && (
                      <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleMarkAsSold(prop); }}><CheckCircle />Mark as Sold</DropdownMenuItem>
                    )}
                    {(isAgentData || profile.role === 'Admin') && (
                      <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleEdit(prop); }}><Edit />Edit Details</DropdownMenuItem>
                    )}
                    {(isAgentData || profile.role === 'Admin') && (
                      prop.is_recorded ? (
                        <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleUnmarkRecorded(prop); }}><VideoOff />Unmark as Recorded</DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleRecordVideo(prop); }}><Video />Mark as Recorded</DropdownMenuItem>
                      )
                    )}
                    {(isAgentData || profile.role !== 'Agent') && (
                      <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleDelete(prop); }} className="text-destructive focus:text-destructive-foreground focus:bg-destructive"><Trash2 />Delete</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderCards = (properties: Property[], isAgentData: boolean) => {
    if (isAgentLoading || isAgencyLoading) return <p className="p-4 text-center">Loading properties...</p>;
    if (properties.length === 0) return <div className="text-center py-10 text-muted-foreground">No properties found for the current filters.</div>;
    return (
      <div className="space-y-4">
        {properties.map((prop) => (
          <Card key={prop.id} className="cursor-pointer" onClick={() => handleRowClick(prop)}>
            <CardHeader>
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <CardTitle className="font-bold font-headline text-base flex items-center gap-2">
                        {prop.auto_title}
                        {prop.is_recorded && <Video className="h-4 w-4 text-primary" />}
                      </CardTitle>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 pt-1">
                          <Badge variant="default" className="font-mono bg-primary/20 text-primary hover:bg-primary/30">{prop.serial_no}</Badge>
                      </div>
                    </div>
                    <Badge className={cn("flex-shrink-0", prop.status === 'Sold' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-primary text-primary-foreground')}>
                        {prop.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2"><Tag className="h-4 w-4 text-muted-foreground" /><div><p className="text-muted-foreground">Type</p><p className="font-medium">{prop.property_type}</p></div></div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><div><p className="text-muted-foreground">Size</p><p className="font-medium">{formatSize(prop.size_value, prop.size_unit)}</p></div></div>
              <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-muted-foreground" /><div><p className="text-muted-foreground">Demand</p><p className="font-medium">{formatDemand(prop.demand_amount, prop.demand_unit)}</p></div></div>
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
                  <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleRowClick(prop); }}><Eye />View Details</DropdownMenuItem>
                  <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleSetAppointment(prop); }}><CalendarPlus />Set Appointment</DropdownMenuItem>
                  {(isAgentData || profile.role !== 'Agent') && (
                    <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleMarkAsSold(prop); }}><CheckCircle />Mark as Sold</DropdownMenuItem>
                  )}
                  {(isAgentData || profile.role === 'Admin') && (
                    <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleEdit(prop); }}><Edit />Edit Details</DropdownMenuItem>
                  )}
                  {(isAgentData || profile.role === 'Admin') && (
                    prop.is_recorded ? (
                      <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleUnmarkRecorded(prop); }}><VideoOff />Unmark as Recorded</DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleRecordVideo(prop); }}><Video />Mark as Recorded</DropdownMenuItem>
                      )
                    )}
                    {(isAgentData || profile.role !== 'Agent') && (
                      <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleDelete(prop); }} className="text-destructive focus:text-destructive-foreground focus:bg-destructive"><Trash2 />Delete</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    };
  
    const renderContent = (properties: Property[], isAgentData: boolean) => {
      return isMobile ? renderCards(properties, isAgentData) : <Card><CardContent className="p-0">{renderTable(properties, isAgentData)}</CardContent></Card>;
    };
  
    return (
      <>
        <TooltipProvider>
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="hidden md:block">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Properties</h1>
                <p className="text-muted-foreground">{activeTab !== 'All' ? `Filtering by status: ${activeTab}` : 'Manage your agency and personal properties.'}</p>
              </div>
              {(profile.role === 'Admin') && (
                <div className="flex w-full md:w-auto items-center gap-2 flex-wrap">
                  <Popover open={isFilterPopoverOpen} onOpenChange={setIsFilterPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="rounded-full"><Filter className="mr-2 h-4 w-4" />Filters</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none">Filters</h4>
                          <p className="text-sm text-muted-foreground">Refine your property search.</p>
                        </div>
                        <div className="grid gap-2">
                          <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="area">Area</Label>
                            <Input id="area" value={filters.area} onChange={(e) => handleFilterChange('area', e.target.value)} className="col-span-2 h-8" />
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
                            <Label>Size</Label>
                            <div className="col-span-2 grid grid-cols-2 gap-2">
                              <Input id="minSize" placeholder="Min" type="number" value={filters.minSize} onChange={(e) => handleFilterChange('minSize', e.target.value)} className="h-8" />
                              <Input id="maxSize" placeholder="Max" type="number" value={filters.maxSize} onChange={(e) => handleFilterChange('maxSize', e.target.value)} className="h-8" />
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
                          <div className="grid grid-cols-3 items-center gap-4">
                            <Label>Demand</Label>
                            <div className="col-span-2 grid grid-cols-2 gap-2">
                              <Input id="minDemand" placeholder="Min" type="number" value={filters.minDemand} onChange={(e) => handleFilterChange('minDemand', e.target.value)} className="h-8" />
                              <Input id="maxDemand" placeholder="Max" type="number" value={filters.maxDemand} onChange={(e) => handleFilterChange('maxDemand', e.target.value)} className="h-8" />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 items-center gap-4">
                            <Label></Label>
                            <div className="col-span-2">
                              <Select value={filters.demandUnit} onValueChange={(value: PriceUnit | 'All') => handleFilterChange('demandUnit', value)}>
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Unit" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="All">All Units</SelectItem>
                                  <SelectItem value="Lacs">Lacs</SelectItem>
                                  <SelectItem value="Crore">Crore</SelectItem>
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
                </div>
              )}
            </div>
  
            {isMobile && (
              <div className="w-full">
                <Select value={activeTab} onValueChange={handleTabChange}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Filter by status..." /></SelectTrigger>
                  <SelectContent>
                    {propertyStatusLinks.map(({ label, status }) => (
                      <SelectItem key={status} value={status}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
  
            {profile.role === 'Agent' ? (
              <Tabs defaultValue="agency-properties" className="w-full mt-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="agency-properties">
                    <Home className="mr-2 h-4 w-4" /> Agency Properties
                  </TabsTrigger>
                  <TabsTrigger value="my-properties">
                    <Briefcase className="mr-2 h-4 w-4" /> My Properties
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="agency-properties" className="mt-4">
                  {renderContent(filteredAgencyProperties, false)}
                </TabsContent>
                <TabsContent value="my-properties" className="mt-4">
                  {renderContent(filteredAgentProperties, true)}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="mt-6">
                {renderContent(filteredAgencyProperties, false)}
              </div>
            )}
          </div>
        </TooltipProvider>
  
        <div className={cn('fixed bottom-20 right-4 md:bottom-8 md:right-8 z-50 transition-opacity', isMoreMenuOpen && 'opacity-0 pointer-events-none')}>
          <Popover open={isAddPopoverOpen} onOpenChange={setIsAddPopoverOpen}>
            <PopoverTrigger asChild>
                <Button className="rounded-full w-14 h-14 shadow-lg glowing-btn" size="icon">
                    <PlusCircle className="h-6 w-6" />
                    <span className="sr-only">Add Property</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-2">
              <div className="flex flex-col gap-2">
                <Button variant="ghost" onClick={() => { setIsAddPropertyOpen(true); setIsAddPopoverOpen(false); }}>Add Property for Sale</Button>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" disabled>
                            Add Property for Rent <Badge variant="destructive" className="ml-2">Soon</Badge>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>This feature is coming soon!</p>
                    </TooltipContent>
                </Tooltip>
              </div>
            </PopoverContent>
          </Popover>
        </div>
  
        <AddPropertyDialog
          isOpen={isAddPropertyOpen}
          setIsOpen={setIsAddPropertyOpen}
          propertyToEdit={propertyToEdit}
          totalProperties={allProperties.length}
          onSave={handleSaveProperty}
        />
  
        {appointmentDetails && (
          <SetAppointmentDialog
            isOpen={isAppointmentOpen}
            setIsOpen={setIsAppointmentOpen}
            onSave={handleSaveAppointment}
            appointmentDetails={appointmentDetails}
          />
        )}
  
        {selectedProperty && (
          <>
            <PropertyDetailsDialog property={selectedProperty} isOpen={isDetailsOpen} setIsOpen={setIsDetailsOpen} />
            <MarkAsSoldDialog property={selectedProperty} isOpen={isSoldOpen} setIsOpen={setIsSoldOpen} onUpdateProperty={handleUpdateProperty} />
            <RecordVideoDialog property={selectedProperty} isOpen={isRecordVideoOpen} setIsOpen={setIsRecordVideoOpen} onUpdateProperty={handleUpdateProperty} />
          </>
        )}
      </>
    );
  }
  
