
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
  ArchiveRestore,
  PackagePlus,
  PackageCheck,
  RotateCcw,
  ChevronDown,
  MessageSquare,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddPropertyDialog } from '@/components/add-property-dialog';
import { Input } from '@/components/ui/input';
import type { Property, PropertyType, SizeUnit, PriceUnit, AppointmentContactType, Appointment, ListingType } from '@/lib/types';
import { useState, useMemo, useEffect, useRef } from 'react';
import { PropertyDetailsDialog } from '@/components/property-details-dialog';
import { MarkAsSoldDialog } from '@/components/mark-as-sold-dialog';
import { MarkAsRentOutDialog } from '@/components/mark-as-rent-out-dialog';
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
import { formatCurrency, formatUnit, formatPhoneNumberForWhatsApp } from '@/lib/formatters';
import { useProfile } from '@/context/profile-context';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, addDoc, setDoc, doc, writeBatch } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/hooks';
import { cn, formatPhoneNumber } from '@/lib/utils';
import { AddSalePropertyForm } from '@/components/add-sale-property-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/firebase/auth/use-user';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


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
  serialNoPrefix: 'All' | 'P' | 'RP';
  serialNo: string;
}

const propertyStatuses = [
    { value: 'All (Sale)', label: 'All (Sale)' },
    { value: 'Available (Sale)', label: 'Available (Sale)' },
    { value: 'Sold', label: 'Sold' },
    { value: 'All (Rent)', label: 'All (Rent)' },
    { value: 'Available (Rent)', label: 'Available (Rent)' },
    { value: 'Rent Out', label: 'Rent Out' },
    { value: 'Recorded', label: 'Recorded' },
];


export default function PropertiesPage() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { profile } = useProfile();
  const { searchQuery } = useSearch();
  const { isMoreMenuOpen } = useUI();
  const { toast } = useToast();
  const { currency } = useCurrency();
  const firestore = useFirestore();

  const statusFilterFromURL = searchParams.get('status');
  const importInputRef = useRef<HTMLInputElement>(null);

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
  
  const [listingType, setListingType] = useState<ListingType>('For Sale');
  
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSoldOpen, setIsSoldOpen] = useState(false);
  const [isRentOutOpen, setIsRentOutOpen] = useState(false);
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
    serialNoPrefix: 'All',
    serialNo: '',
  });
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  
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
      serialNoPrefix: 'All',
      serialNo: '',
    });
    setIsFilterPopoverOpen(false);
  };

  const filteredProperties = useMemo(() => {
    let baseProperties = allProperties.filter(p => !p.is_deleted);

    // 1. Primary Filter: Search Query
    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        baseProperties = baseProperties.filter(
            (prop) =>
                (prop.auto_title && prop.auto_title.toLowerCase().includes(lowercasedQuery)) ||
                prop.address.toLowerCase().includes(lowercasedQuery) ||
                prop.area.toLowerCase().includes(lowercasedQuery) ||
                prop.serial_no.toLowerCase().includes(lowercasedQuery) ||
                (prop.video_links && Object.values(prop.video_links).some(link => link && link.toLowerCase().includes(lowercasedQuery)))
        );
    }

    // 2. Secondary Filter: Advanced Filters Popover
    if (filters.area) baseProperties = baseProperties.filter((p) => p.area.toLowerCase().includes(filters.area.toLowerCase()));
    if (filters.propertyType !== 'All') baseProperties = baseProperties.filter((p) => p.property_type === filters.propertyType);
    if (filters.minSize) baseProperties = baseProperties.filter((p) => p.size_value >= Number(filters.minSize) && (filters.sizeUnit === 'All' || p.size_unit === filters.sizeUnit));
    if (filters.maxSize) baseProperties = baseProperties.filter((p) => p.size_value <= Number(filters.maxSize) && (filters.sizeUnit === 'All' || p.size_unit === filters.sizeUnit));
    if (filters.minDemand) baseProperties = baseProperties.filter((p) => p.demand_amount >= Number(filters.minDemand) && (filters.demandUnit === 'All' || p.demand_unit === filters.demandUnit));
    if (filters.maxDemand) baseProperties = baseProperties.filter((p) => p.demand_amount <= Number(filters.maxDemand) && (filters.demandUnit === 'All' || p.demand_unit === filters.demandUnit));
    if (filters.serialNo && filters.serialNoPrefix !== 'All') {
        const fullSerialNo = `${filters.serialNoPrefix}-${filters.serialNo}`;
        baseProperties = baseProperties.filter(p => p.serial_no === fullSerialNo);
    }

    // 3. Final Filter: URL Status Param
    const currentStatusFilter = statusFilterFromURL || 'All (Sale)';

    switch (currentStatusFilter) {
        case 'All (Sale)':
            return baseProperties.filter(p => !p.is_for_rent);
        case 'Available (Sale)':
            return baseProperties.filter(p => p.status === 'Available' && !p.is_for_rent);
        case 'Sold':
            return baseProperties.filter(p => p.status === 'Sold' && !p.is_for_rent);
        case 'All (Rent)':
            return baseProperties.filter(p => p.is_for_rent);
        case 'Available (Rent)':
             return baseProperties.filter(p => p.status === 'Available' && p.is_for_rent);
        case 'Rent Out':
            return baseProperties.filter(p => p.status === 'Rent Out');
        case 'Recorded':
            return baseProperties.filter(p => p.is_recorded);
        default:
             return baseProperties.filter(p => !p.is_for_rent);
    }

  }, [searchQuery, filters, allProperties, statusFilterFromURL]);


  const handleRowClick = (prop: Property) => {
    setSelectedProperty(prop);
    setIsDetailsOpen(true);
  };
  
  const handleOpenAddDialog = (type: ListingType) => {
    if (user && !user.emailVerified) {
        toast({
            title: 'Email Verification Required',
            description: 'Please verify your email address to add new properties.',
            variant: 'destructive',
        });
    } else {
        setListingType(type);
        setPropertyToEdit(null);
        setIsAddPropertyOpen(true);
    }
  }

  const handleMarkAsSold = (prop: Property) => {
    setSelectedProperty(prop);
    setIsSoldOpen(true);
  };
  
  const handleMarkAsRentOut = (prop: Property) => {
    setSelectedProperty(prop);
    setIsRentOutOpen(true);
  };

  const handleRecordVideo = (prop: Property) => {
    setSelectedProperty(prop);
    setIsRecordVideoOpen(true);
  };

  const handleEdit = (prop: Property) => {
    setListingType(prop.is_for_rent ? 'For Rent' : 'For Sale');
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
  
  const handleWhatsAppChat = (e: React.MouseEvent, prop: Property) => {
    e.stopPropagation();
    const phoneNumber = formatPhoneNumberForWhatsApp(prop.owner_number, prop.country_code);
    window.open(`https://wa.me/${phoneNumber}`, '_blank');
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
  
  const handleMarkAsAvailableForRent = async (prop: Property) => {
    const { collectionName, collectionId } = getPropertyCollectionInfo(prop);
    if (!collectionId) return;
    const docRef = doc(firestore, collectionName, collectionId, 'properties', prop.id);
    await setDoc(docRef, { 
        status: 'Available', 
        rent_out_date: null,
        rented_by_agent_id: null,
        rent_commission_from_tenant: null,
        rent_commission_from_owner: null,
        rent_total_commission: null,
        rent_agent_share: null
    }, { merge: true });
    toast({ title: 'Property Marked as Available for Rent' });
  };

  const handleMarkAsUnsold = async (prop: Property) => {
    const { collectionName, collectionId } = getPropertyCollectionInfo(prop);
    if (!collectionId) return;

    const docRef = doc(firestore, 'agencies', profile.agency_id, 'properties', prop.id);
    await setDoc(docRef, { 
      status: 'Available',
      sold_price: null,
      sold_price_unit: null,
      sale_date: null,
      sold_by_agent_id: null,
      commission_from_buyer: null,
      commission_from_buyer_unit: null,
      commission_from_seller: null,
      commission_from_seller_unit: null,
      total_commission: null,
      agent_commission_amount: null,
      agent_commission_unit: null,
      agent_share_percentage: null
    }, { merge: true });
    toast({ title: 'Property Status Updated', description: `${prop.serial_no} marked as Available again.` });
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
        const { collectionName, collectionId } = getPropertyCollectionInfo(propertyToEdit);
        if (!collectionId) return;

        const docRef = doc(firestore, collectionName, collectionId, 'properties', propertyData.id);
        await setDoc(docRef, propertyData, { merge: true });
        toast({ title: 'Property Updated' });
    } else {
        const collectionName = isAgentAdding ? 'agents' : 'agencies';
        const collectionId = isAgentAdding ? profile.user_id : profile.agency_id;
        
        if (!collectionId) return;
        
        const collectionRef = collection(firestore, collectionName, collectionId, 'properties');
        const { id, ...restOfData } = propertyData;
        
        await addDoc(collectionRef, { 
            ...restOfData,
            created_by: profile.user_id,
            agency_id: profile.agency_id
        });
        toast({ title: 'Property Added' });
    }
    setPropertyToEdit(null);
  };
  
  const handleStatusChange = (status: string) => {
      const url = `${pathname}?status=${encodeURIComponent(status)}`;
      router.push(url);
  };

  const sortProperties = (propertiesToSort: Property[]) => {
    return [...propertiesToSort].sort((a, b) => {
        const aParts = a.serial_no.split('-');
        const bParts = b.serial_no.split('-');
        const aPrefix = aParts[0];
        const bPrefix = bParts[0];
        const aNum = parseInt(aParts[1], 10);
        const bNum = parseInt(bParts[1], 10);
        
        if (aPrefix < bPrefix) return -1;
        if (aPrefix > bPrefix) return 1;
        return aNum - bNum;
    });
  };

  const handleExport = (type: 'For Sale' | 'For Rent') => {
    const propertiesToExport = sortProperties(
        allProperties.filter(p => (p.listing_type === type || (!p.listing_type && type === 'For Sale')) && !p.is_deleted)
    );

    if (propertiesToExport.length === 0) {
      toast({ title: 'No Data', description: `There are no properties for ${type.toLowerCase()} to export.`, variant: 'destructive' });
      return;
    }

    const headers = type === 'For Sale'
        ? ['Sr No', 'Video Record', 'Date', 'Number', 'City', 'Area', 'Address', 'Property Type', 'Size', 'Road Size', 'Storey', 'Utilities', 'Potential Rent', 'Front', 'Length', 'Demand', 'Documents', 'Status']
        : ['Sr No', 'Video Record', 'Date', 'Number', 'City', 'Area', 'Address', 'Property Type', 'Size', 'Storey', 'Utilities', 'Rent', 'Status'];

    const csvContent = [
      headers.join(','),
      ...propertiesToExport.map(p => {
        const demandValue = p.demand_unit === 'Crore' ? `${p.demand_amount} Cr` : `${p.demand_amount} Lacs`;
        const potentialRentValue = p.potential_rent_amount ? formatUnit(p.potential_rent_amount, p.potential_rent_unit || 'Thousand') : '';
        const utilities = [
            p.meters?.electricity && 'Electricity',
            p.meters?.gas && 'Gas',
            p.meters?.water && 'Water'
        ].filter(Boolean).join('/');

        const row = type === 'For Sale'
            ? [
                `"${p.serial_no}"`,
                `"${p.is_recorded ? '✔' : ''}"`,
                `"${new Date(p.created_at).toLocaleDateString()}"`,
                `"${formatPhoneNumber(p.owner_number, p.country_code).replace('+', '')}"`,
                `"${p.city}"`,
                `"${p.area}"`,
                `"${p.address}"`,
                `"${p.property_type}"`,
                `"${p.size_value} ${p.size_unit}"`,
                `"${p.road_size_ft ? `${p.road_size_ft} ft` : ''}"`,
                `"${p.storey || ''}"`,
                `"${utilities}"`,
                `"${potentialRentValue}"`,
                `"${p.front_ft || ''}"`,
                `"${p.length_ft || ''}"`,
                `"${demandValue}"`,
                `"${p.documents || ''}"`,
                `"${p.status}"`
            ]
            : [
                 `"${p.serial_no}"`,
                `"${p.is_recorded ? '✔' : ''}"`,
                `"${new Date(p.created_at).toLocaleDateString()}"`,
                `"${formatPhoneNumber(p.owner_number, p.country_code).replace('+', '')}"`,
                `"${p.city}"`,
                `"${p.area}"`,
                `"${p.address}"`,
                `"${p.property_type}"`,
                `"${p.size_value} ${p.size_unit}"`,
                `"${p.storey || ''}"`,
                `"${utilities}"`,
                `"${p.demand_amount} ${p.demand_unit}"`,
                `"${p.status}"`
            ];
        return row.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `properties-${type.toLowerCase().replace(' ', '-')}-${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportDialogOpen(false);
  };


  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile.agency_id) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') return;
      
      const rows = text.split('\n');
      const headerRow = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const isSaleImport = headerRow.includes('Potential Rent');

      if (rows.length <= 1) {
        toast({ title: 'Empty File', description: 'The CSV file is empty or invalid.', variant: 'destructive' });
        return;
      }

      const batch = writeBatch(firestore);
      const collectionRef = collection(firestore, 'agencies', profile.agency_id, 'properties');
      const totalSaleProperties = allProperties.filter(p => !p.is_for_rent).length;
      const totalRentProperties = allProperties.filter(p => p.is_for_rent).length;
      let newCount = 0;

      rows.slice(1).forEach((row) => {
        if (!row) return;
        const values = row.split(',').map(s => s.trim().replace(/"/g, ''));
        
        let newProperty: Omit<Property, 'id'>;

        if (isSaleImport) {
            const [
                _serial, _video, _date, number, city, area, address, property_type, size,
                road_size_ft, storey, utilities, potential_rent_amount, front_ft, length_ft,
                demand, documents, status
            ] = values;

            const [size_value, size_unit] = size.split(' ');
            const [demand_amount, demand_unit] = demand.split(' ');

            newProperty = {
                serial_no: `P-${totalSaleProperties + newCount + 1}`,
                auto_title: `${size} ${property_type} in ${area}`,
                property_type: property_type as PropertyType,
                area, address, city,
                size_value: parseFloat(size_value),
                size_unit: size_unit as SizeUnit,
                demand_amount: parseFloat(demand_amount),
                demand_unit: demand_unit as 'Lacs' | 'Crore',
                status: 'Available',
                owner_number: formatPhoneNumber(number, '+92'),
                country_code: '+92',
                listing_type: 'For Sale',
                is_for_rent: false,
                created_at: new Date().toISOString(),
                created_by: profile.user_id,
                agency_id: profile.agency_id,
                is_recorded: false,
                road_size_ft: road_size_ft ? parseInt(road_size_ft.replace(' ft', '')) : undefined,
                storey: storey || undefined,
                potential_rent_amount: potential_rent_amount ? parseInt(potential_rent_amount) : undefined,
                potential_rent_unit: 'Thousand',
                front_ft: front_ft ? parseInt(front_ft) : undefined,
                length_ft: length_ft ? parseInt(length_ft) : undefined,
                documents: documents || undefined,
                meters: {
                    electricity: utilities.includes('Electricity'),
                    gas: utilities.includes('Gas'),
                    water: utilities.includes('Water'),
                },
            };
        } else { // Rent import
             const [
                _serial, _video, _date, number, city, area, address, property_type, size,
                storey, utilities, rent, status
            ] = values;

            const [size_value, size_unit] = size.split(' ');
            const [demand_amount, demand_unit] = rent.split(' ');

            newProperty = {
                serial_no: `RP-${totalRentProperties + newCount + 1}`,
                auto_title: `${size} ${property_type} for rent in ${area}`,
                property_type: property_type as PropertyType,
                area, address, city,
                size_value: parseFloat(size_value),
                size_unit: size_unit as SizeUnit,
                demand_amount: parseFloat(demand_amount),
                demand_unit: demand_unit as 'Thousand',
                status: 'Available',
                owner_number: formatPhoneNumber(number, '+92'),
                country_code: '+92',
                listing_type: 'For Rent',
                is_for_rent: true,
                created_at: new Date().toISOString(),
                created_by: profile.user_id,
                agency_id: profile.agency_id,
                is_recorded: false,
                storey: storey || undefined,
                meters: {
                    electricity: utilities.includes('Electricity'),
                    gas: utilities.includes('Gas'),
                    water: utilities.includes('Water'),
                },
            };
        }
        
        batch.set(doc(collectionRef), newProperty);
        newCount++;
      });
      
      try {
        await batch.commit();
        toast({ title: 'Import Successful', description: `${newCount} new properties have been added.` });
      } catch (error) {
        console.error(error);
        toast({ title: 'Import Failed', description: 'An error occurred during import.', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
    if(importInputRef.current) importInputRef.current.value = '';
  };


  const renderTable = (properties: Property[]) => {
    if (isAgencyLoading || isAgentLoading) return <p className="p-4 text-center">Loading properties...</p>;
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
            <TableRow key={prop.id} className="hover:bg-accent/50 transition-colors cursor-pointer">
              <TableCell onClick={() => handleRowClick(prop)}>
                <div className="flex items-center gap-2">
                  <span className="font-bold font-headline text-base flex items-center gap-2">
                    {prop.auto_title || `${prop.size_value} ${prop.size_unit} ${prop.property_type} in ${prop.area}`}
                    {prop.is_recorded && (
                       <Tooltip>
                        <TooltipTrigger asChild>
                           <Video className="h-4 w-4 text-primary" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Video is recorded</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                   <Badge
                    variant="default"
                    className={cn(
                      'font-mono',
                      prop.serial_no.startsWith('RP')
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 hover:bg-emerald-100/80'
                        : 'bg-primary/20 text-primary hover:bg-primary/30'
                    )}
                  >
                    {prop.serial_no}
                  </Badge>
                  <span className="truncate max-w-48">{prop.address}</span>
                </div>
              </TableCell>
              <TableCell onClick={() => handleRowClick(prop)}>{prop.property_type}</TableCell>
              <TableCell onClick={() => handleRowClick(prop)}>{formatSize(prop.size_value, prop.size_unit)}</TableCell>
              <TableCell onClick={() => handleRowClick(prop)}>{formatDemand(prop.demand_amount, prop.demand_unit)}</TableCell>
              <TableCell onClick={() => handleRowClick(prop)}>
                <div className="flex flex-col gap-1 items-start">
                    <Badge className={prop.status === 'Sold' ? 'bg-green-600 hover:bg-green-700 text-white' : prop.status === 'Rent Out' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-primary text-primary-foreground'}>
                    {prop.status}
                    </Badge>
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
                    <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleRowClick(prop); }}><Eye />View Details</DropdownMenuItem>
                    <DropdownMenuItem onSelect={(e) => handleWhatsAppChat(e, prop)}><MessageSquare /> Chat on WhatsApp</DropdownMenuItem>
                    <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleSetAppointment(prop); }}><CalendarPlus />Set Appointment</DropdownMenuItem>
                    {prop.is_for_rent && prop.status === 'Available' && (
                        <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleMarkAsRentOut(prop); }}><ArchiveRestore />Mark as Rent Out</DropdownMenuItem>
                    )}
                    {prop.is_for_rent && prop.status === 'Rent Out' && (
                        <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleMarkAsAvailableForRent(prop); }}><RotateCcw />Mark as Available</DropdownMenuItem>
                    )}
                    {prop.status === 'Available' && !prop.is_for_rent && (
                        <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleMarkAsSold(prop); }}><CheckCircle />Mark as Sold</DropdownMenuItem>
                    )}
                    {prop.status === 'Sold' && (
                        <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleMarkAsUnsold(prop); }}><RotateCcw />Mark as Unsold</DropdownMenuItem>
                    )}
                    {(profile.role === 'Admin') && (
                      <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleEdit(prop); }}><Edit />Edit Details</DropdownMenuItem>
                    )}
                    {(profile.role === 'Admin') && (
                      prop.is_recorded ? (
                        <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleUnmarkRecorded(prop); }}><VideoOff />Unmark as Recorded</DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleRecordVideo(prop); }}><Video />Mark as Recorded</DropdownMenuItem>
                      )
                    )}
                    {(profile.role !== 'Agent') && (
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

  const renderCards = (properties: Property[]) => {
    if (isAgencyLoading || isAgentLoading) return <p className="p-4 text-center">Loading properties...</p>;
    if (properties.length === 0) return <div className="text-center py-10 text-muted-foreground">No properties found for the current filters.</div>;
    return (
      <div className="space-y-4">
        {properties.map((prop) => (
          <Card key={prop.id}>
            <CardHeader>
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                    <CardTitle className="font-bold font-headline text-base flex items-center gap-2">
                      {prop.auto_title || `${prop.size_value} ${prop.size_unit} ${prop.property_type} in ${prop.area}`}
                      {prop.is_recorded && <Video className="h-4 w-4 text-primary" />}
                    </CardTitle>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 pt-1">
                         <Badge
                            variant="default"
                            className={cn(
                              'font-mono',
                              prop.serial_no.startsWith('RP')
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 hover:bg-emerald-100/80'
                                : 'bg-primary/20 text-primary hover:bg-primary/30'
                            )}
                          >
                            {prop.serial_no}
                          </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                        <Badge className={cn("flex-shrink-0", prop.status === 'Sold' ? 'bg-green-600 hover:bg-green-700 text-white' : prop.status === 'Rent Out' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-primary text-primary-foreground')}>
                            {prop.status}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2"><Tag className="h-4 w-4 text-muted-foreground" /><div><p className="text-muted-foreground">Type</p><p className="font-medium">{prop.property_type}</p></div></div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><div><p className="text-muted-foreground">Size</p><p className="font-medium">{formatSize(prop.size_value, prop.size_unit)}</p></div></div>
              <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-muted-foreground" /><div><p className="text-muted-foreground">Demand</p><p className="font-medium">{formatDemand(prop.demand_amount, prop.demand_unit)}</p></div></div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Sheet>
                <SheetTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost" className="rounded-full -mr-4 -mb-4" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="w-full">
                    <SheetHeader className="text-left mb-4">
                        <SheetTitle>Actions for {prop.serial_no}</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-2">
                        <Button variant="outline" className="justify-start" onClick={(e) => { e.stopPropagation(); handleRowClick(prop); }}><Eye />View Details</Button>
                        <Button variant="outline" className="justify-start" onClick={(e) => handleWhatsAppChat(e, prop)}><MessageSquare /> Chat on WhatsApp</Button>
                        <Button variant="outline" className="justify-start" onClick={(e) => { e.stopPropagation(); handleSetAppointment(prop); }}><CalendarPlus />Set Appointment</Button>
                        {prop.is_for_rent && prop.status === 'Available' && (
                            <Button variant="outline" className="justify-start" onClick={(e) => { e.stopPropagation(); handleMarkAsRentOut(prop); }}><ArchiveRestore />Mark as Rent Out</Button>
                        )}
                        {prop.is_for_rent && prop.status === 'Rent Out' && (
                           <Button variant="outline" className="justify-start" onClick={(e) => { e.stopPropagation(); handleMarkAsAvailableForRent(prop); }}><RotateCcw />Mark as Available</Button>
                        )}
                        {prop.status === 'Available' && !prop.is_for_rent && (
                            <Button variant="outline" className="justify-start" onClick={(e) => { e.stopPropagation(); handleMarkAsSold(prop); }}><CheckCircle />Mark as Sold</Button>
                        )}
                        {prop.status === 'Sold' && (
                            <Button variant="outline" className="justify-start" onClick={(e) => { e.stopPropagation(); handleMarkAsUnsold(prop); }}><RotateCcw />Mark as Unsold</Button>
                        )}
                        {(profile.role === 'Admin') && (
                          <Button variant="outline" className="justify-start" onClick={(e) => { e.stopPropagation(); handleEdit(prop); }}><Edit />Edit Details</Button>
                        )}
                        {(profile.role === 'Admin') && (
                          prop.is_recorded ? (
                            <Button variant="outline" className="justify-start" onClick={(e) => { e.stopPropagation(); handleUnmarkRecorded(prop); }}><VideoOff />Unmark as Recorded</Button>
                          ) : (
                            <Button variant="outline" className="justify-start" onClick={(e) => { e.stopPropagation(); handleRecordVideo(prop); }}><Video />Mark as Recorded</Button>
                          )
                        )}
                        {(profile.role !== 'Agent') && (
                          <>
                          <Separator />
                          <Button variant="destructive" className="justify-start" onClick={(e) => { e.stopPropagation(); handleDelete(prop); }}><Trash2 />Delete</Button>
                          </>
                        )}
                    </div>
                </SheetContent>
              </Sheet>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };
  
  const renderContent = (properties: Property[]) => {
      return isMobile ? renderCards(properties) : <Card><CardContent className="p-0">{renderTable(properties)}</CardContent></Card>;
  };

    return (
      <>
        <TooltipProvider>
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="hidden md:block">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Properties</h1>
                <p className="text-muted-foreground">Manage your agency and personal properties.</p>
              </div>
              <div className="flex w-full md:w-auto items-center gap-2 flex-wrap">
                  {isMobile && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-auto">
                                {statusFilterFromURL ? propertyStatuses.find(s => s.value === statusFilterFromURL)?.label : 'All (Sale)'}
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {propertyStatuses.map(status => (
                                <DropdownMenuItem key={status.value} onSelect={() => handleStatusChange(status.value)}>
                                    {status.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {(profile.role === 'Admin' || profile.role === 'Editor') && (
                      <>
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
                                    <Label>Serial No</Label>
                                    <div className="col-span-2 grid grid-cols-2 gap-2">
                                        <Select value={filters.serialNoPrefix} onValueChange={(value: 'All' | 'P' | 'RP') => handleFilterChange('serialNoPrefix', value)}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Prefix" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="All">All</SelectItem>
                                                <SelectItem value="P">P</SelectItem>
                                                <SelectItem value="RP">RP</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Input id="serialNo" placeholder="e.g. 1" type="number" value={filters.serialNo} onChange={e => handleFilterChange('serialNo', e.target.value)} className="h-8" />
                                    </div>
                                </div>
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
                        <Button variant="outline" className="rounded-full" onClick={() => importInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Import</Button>
                        <input type="file" ref={importInputRef} className="hidden" accept=".csv" onChange={handleImport} />
                        <Button variant="outline" className="rounded-full" onClick={() => setIsExportDialogOpen(true)}><Download className="mr-2 h-4 w-4" />Export</Button>
                      </>
                  )}
              </div>
            </div>
            
            <div className="mt-4">
              {renderContent(filteredProperties)}
            </div>

          </div>
        </TooltipProvider>
  
        <div className={cn('fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 transition-opacity', isMoreMenuOpen && 'opacity-0 pointer-events-none')}>
            <Popover open={isAddMenuOpen} onOpenChange={setIsAddMenuOpen}>
                <PopoverTrigger asChild>
                    <Button onClick={() => user && !user.emailVerified && handleOpenAddDialog('For Sale')} className="rounded-full w-14 h-14 shadow-lg glowing-btn" size="icon">
                        <PlusCircle className="h-6 w-6" />
                        <span className="sr-only">Add Property</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-2 mb-2">
                    <div className="flex flex-col gap-2">
                        <Button variant="ghost" onClick={() => { handleOpenAddDialog('For Sale'); setIsAddMenuOpen(false); }}>For Sale</Button>
                        <Button variant="ghost" onClick={() => { handleOpenAddDialog('For Rent'); setIsAddMenuOpen(false); }}>For Rent</Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
  
        <AddPropertyDialog
          isOpen={isAddPropertyOpen}
          setIsOpen={setIsAddPropertyOpen}
          propertyToEdit={propertyToEdit}
          allProperties={allProperties}
          onSave={handleSaveProperty}
          listingType={listingType}
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
            <MarkAsRentOutDialog property={selectedProperty} isOpen={isRentOutOpen} setIsOpen={setIsRentOutOpen} onUpdateProperty={handleUpdateProperty} />
            <RecordVideoDialog property={selectedProperty} isOpen={isRecordVideoOpen} setIsOpen={setIsRecordVideoOpen} onUpdateProperty={handleUpdateProperty} />
          </>
        )}
        
        <AlertDialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Choose Export Type</AlertDialogTitle>
                <AlertDialogDescription>
                    Select which type of properties you would like to export to a CSV file.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleExport('For Sale')}>Export Sale Properties</AlertDialogAction>
                <AlertDialogAction onClick={() => handleExport('For Rent')}>Export Rent Properties</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      </>
    );
  }

    

    