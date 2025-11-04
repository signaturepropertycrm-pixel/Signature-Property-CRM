
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
  PlusCircle,
} from 'lucide-react';
import { properties as allProperties } from '@/lib/data';
import { AddPropertyDialog } from '@/components/add-property-dialog';
import { Input } from '@/components/ui/input';
import type { Property, PropertyType, SizeUnit } from '@/lib/types';
import { useState, useMemo } from 'react';
import { PropertyDetailsDialog } from '@/components/property-details-dialog';
import { MarkAsSoldDialog } from '@/components/mark-as-sold-dialog';
import { RecordVideoDialog } from '@/components/record-video-dialog';
import { Card, CardContent } from '@/components/ui/card';
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

function formatDemand(amount: number, unit: string) {
  return `${amount} ${unit}`;
}

function formatSize(value: number, unit: string) {
  return `${value} ${unit}`;
}

const statusVariant = {
  Available: 'default',
  Reserved: 'secondary',
  Sold: 'destructive',
  'Off-Market': 'outline',
} as const;

interface Filters {
  area: string;
  propertyType: PropertyType | 'All';
  minSize: string;
  maxSize: string;
  minDemand: string;
  maxDemand: string;
}

export default function PropertiesPage() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSoldOpen, setIsSoldOpen] = useState(false);
  const [isRecordVideoOpen, setIsRecordVideoOpen] = useState(false);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({
    area: '',
    propertyType: 'All',
    minSize: '',
    maxSize: '',
    minDemand: '',
    maxDemand: '',
  });
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);

  const handleFilterChange = (
    key: keyof Filters,
    value: string | PropertyType
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      area: '',
      propertyType: 'All',
      minSize: '',
      maxSize: '',
      minDemand: '',
      maxDemand: '',
    });
    setIsFilterPopoverOpen(false);
  };
  
  const properties = useMemo(() => {
    let filteredProperties = allProperties;

    // Search query filter
    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filteredProperties = filteredProperties.filter(prop => 
            prop.auto_title.toLowerCase().includes(lowercasedQuery) ||
            prop.address.toLowerCase().includes(lowercasedQuery) ||
            prop.area.toLowerCase().includes(lowercasedQuery) ||
            prop.serial_no.toLowerCase().includes(lowercasedQuery) ||
            String(prop.size_value).toLowerCase().includes(lowercasedQuery) ||
            String(prop.demand_amount).toLowerCase().includes(lowercasedQuery)
        );
    }
    
    // Advanced filters
    if (filters.area) {
        filteredProperties = filteredProperties.filter(p => p.area.toLowerCase().includes(filters.area.toLowerCase()));
    }
    if (filters.propertyType !== 'All') {
        filteredProperties = filteredProperties.filter(p => p.property_type === filters.propertyType);
    }
    if (filters.minSize) {
        filteredProperties = filteredProperties.filter(p => p.size_value >= Number(filters.minSize));
    }
    if (filters.maxSize) {
        filteredProperties = filteredProperties.filter(p => p.size_value <= Number(filters.maxSize));
    }
    // Note: This demand filter is simplified and doesn't account for units (Lacs vs Crore)
    if (filters.minDemand) {
        filteredProperties = filteredProperties.filter(p => p.demand_amount >= Number(filters.minDemand));
    }
    if (filters.maxDemand) {
        filteredProperties = filteredProperties.filter(p => p.demand_amount <= Number(filters.maxDemand));
    }


    return filteredProperties;
  }, [searchQuery, filters]);

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
    setSelectedProperty(prop);
    setIsAddPropertyOpen(true); // Re-using add dialog for editing
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">
              Properties
            </h1>
            <p className="text-muted-foreground">
              Browse and manage your property listings.
            </p>
          </div>
          <div className="flex w-full md:w-auto items-center gap-2 flex-wrap">
             <div className="relative w-full md:w-64">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input 
                placeholder="Search area, size, demand..." 
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
                      Refine your property search.
                    </p>
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
                      <Label>Size</Label>
                      <div className="col-span-2 grid grid-cols-2 gap-2">
                        <Input id="minSize" placeholder="Min" type="number" value={filters.minSize} onChange={e => handleFilterChange('minSize', e.target.value)} className="h-8" />
                        <Input id="maxSize" placeholder="Max" type="number" value={filters.maxSize} onChange={e => handleFilterChange('maxSize', e.target.value)} className="h-8" />
                      </div>
                    </div>
                     <div className="grid grid-cols-3 items-center gap-4">
                      <Label>Demand</Label>
                      <div className="col-span-2 grid grid-cols-2 gap-2">
                        <Input id="minDemand" placeholder="Min" type="number" value={filters.minDemand} onChange={e => handleFilterChange('minDemand', e.target.value)} className="h-8" />
                        <Input id="maxDemand" placeholder="Max" type="number" value={filters.maxDemand} onChange={e => handleFilterChange('maxDemand', e.target.value)} className="h-8" />
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
            <AddPropertyDialog 
                isOpen={isAddPropertyOpen}
                setIsOpen={setIsAddPropertyOpen}
                propertyToEdit={selectedProperty}
            />
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[350px]">Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Demand</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((prop) => (
                  <TableRow key={prop.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => handleRowClick(prop)}>
                    <TableCell>
                      <div className="font-bold font-headline text-base">
                        {prop.auto_title}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono flex items-center gap-2">
                        <span>{prop.serial_no}</span>
                        <span className="truncate max-w-48">{prop.address}</span>
                      </div>
                    </TableCell>
                    <TableCell>{prop.property_type}</TableCell>
                    <TableCell>
                      {formatSize(prop.size_value, prop.size_unit)}
                    </TableCell>
                    <TableCell>
                      {formatDemand(prop.demand_amount, prop.demand_unit)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[prop.status]} className="capitalize">
                        {prop.status}
                      </Badge>
                       {prop.is_recorded && <Badge variant="secondary" className="text-xs ml-2">Recorded</Badge>}
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
                           <DropdownMenuItem onSelect={() => handleRowClick(prop)}>
                            <Eye />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleEdit(prop)}>
                            <Edit />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleMarkAsSold(prop)}>
                            <CheckCircle />
                            Mark as Sold
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleRecordVideo(prop)}>
                            <Video />
                            Mark as Recorded
                          </DropdownMenuItem>
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
          </CardContent>
        </Card>
      </div>
      <div className="fixed bottom-8 right-8 z-50">
        <Button onClick={() => { setSelectedProperty(null); setIsAddPropertyOpen(true); }} className="rounded-full w-14 h-14 shadow-lg glowing-btn" size="icon">
            <PlusCircle className="h-6 w-6" />
            <span className="sr-only">Add Property</span>
        </Button>
      </div>
      {selectedProperty && (
        <>
          <PropertyDetailsDialog
            property={selectedProperty}
            isOpen={isDetailsOpen}
            setIsOpen={setIsDetailsOpen}
          />
          <MarkAsSoldDialog
            property={selectedProperty}
            isOpen={isSoldOpen}
            setIsOpen={setIsSoldOpen}
          />
          <RecordVideoDialog
            property={selectedProperty}
            isOpen={isRecordVideoOpen}
            setIsOpen={setIsRecordVideoOpen}
          />
        </>
      )}
    </>
  );
}

    