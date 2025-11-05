
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
  MapPin,
  Tag,
  Wallet,
  VideoOff,
} from 'lucide-react';
import { properties as initialProperties } from '@/lib/data';
import { AddPropertyDialog } from '@/components/add-property-dialog';
import { Input } from '@/components/ui/input';
import type { Property, PropertyType, SizeUnit, PropertyStatus } from '@/lib/types';
import { useState, useMemo } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';


function formatDemand(amount: number, unit: string) {
  return `${amount} ${unit}`;
}

function formatSize(value: number, unit: string) {
  return `${value} ${unit}`;
}

const statusVariant = {
  Available: 'secondary',
  Sold: 'default',
} as const;

interface Filters {
  area: string;
  propertyType: PropertyType | 'All';
  minSize: string;
  maxSize: string;
  minDemand: string;
  maxDemand: string;
}

type FilterTab = 'All' | 'Available' | 'Sold' | 'Recorded';


export default function PropertiesPage() {
  const isMobile = useIsMobile();
  const [properties, setProperties] = useState<Property[]>(initialProperties);
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
  const [activeTab, setActiveTab] = useState<FilterTab>('All');

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
  
  const filteredProperties = useMemo(() => {
    let filtered = properties;

    // Status tab filter
    if (activeTab === 'Available' || activeTab === 'Sold') {
        filtered = filtered.filter(p => p.status === activeTab);
    } else if (activeTab === 'Recorded') {
        filtered = filtered.filter(p => p.is_recorded);
    }
    
    // Search query filter
    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(prop => 
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
        filtered = filtered.filter(p => p.area.toLowerCase().includes(filters.area.toLowerCase()));
    }
    if (filters.propertyType !== 'All') {
        filtered = filtered.filter(p => p.property_type === filters.propertyType);
    }
    if (filters.minSize) {
        filtered = filtered.filter(p => p.size_value >= Number(filters.minSize));
    }
    if (filters.maxSize) {
        filtered = filtered.filter(p => p.size_value <= Number(filters.maxSize));
    }
    // Note: This demand filter is simplified and doesn't account for units (Lacs vs Crore)
    if (filters.minDemand) {
        filtered = filtered.filter(p => p.demand_amount >= Number(filters.minDemand));
    }
    if (filters.maxDemand) {
        filtered = filtered.filter(p => p.demand_amount <= Number(filters.maxDemand));
    }


    return filtered;
  }, [searchQuery, filters, activeTab, properties]);

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
  
  const handleUnmarkRecorded = (prop: Property) => {
    setProperties(prev => prev.map(p => p.id === prop.id ? {...p, is_recorded: false, video_links: {}} : p));
  };

  const handleUpdateProperty = (updatedProperty: Property) => {
    setProperties(prev => prev.map(p => p.id === updatedProperty.id ? updatedProperty : p));
  };
  
  const renderTable = () => (
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
          {filteredProperties.map((prop) => (
            <TableRow key={prop.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => handleRowClick(prop)}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-bold font-headline text-base">
                    {prop.auto_title}
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
              <TableCell>
                {formatSize(prop.size_value, prop.size_unit)}
              </TableCell>
              <TableCell>
                {formatDemand(prop.demand_amount, prop.demand_unit)}
              </TableCell>
              <TableCell>
                <Badge 
                  variant={statusVariant[prop.status as keyof typeof statusVariant] || 'default'}
                  className={prop.status === 'Sold' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                >
                  {prop.status}
                </Badge>
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
                    {prop.is_recorded ? (
                      <DropdownMenuItem onSelect={() => handleUnmarkRecorded(prop)}>
                        <VideoOff />
                        Unmark as Recorded
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onSelect={() => handleRecordVideo(prop)}>
                        <Video />
                        Mark as Recorded
                      </DropdownMenuItem>
                    )}
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
        {filteredProperties.map((prop) => (
            <Card key={prop.id} className="cursor-pointer" onClick={() => handleRowClick(prop)}>
                <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                             <span className="font-bold font-headline text-base">
                                {prop.auto_title}
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
                        <Badge 
                           variant={statusVariant[prop.status as keyof typeof statusVariant] || 'default'}
                           className={prop.status === 'Sold' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                        >
                            {prop.status}
                        </Badge>
                    </CardTitle>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 pt-1">
                        <Badge variant="default" className="font-mono bg-primary/20 text-primary hover:bg-primary/30">{prop.serial_no}</Badge>
                        <span className="truncate">{prop.address}</span>
                    </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-muted-foreground">Type</p>
                            <p className="font-medium">{prop.property_type}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-muted-foreground">Size</p>
                            <p className="font-medium">{formatSize(prop.size_value, prop.size_unit)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-muted-foreground">Demand</p>
                            <p className="font-medium">{formatDemand(prop.demand_amount, prop.demand_unit)}</p>
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
                          {prop.is_recorded ? (
                            <DropdownMenuItem onSelect={() => handleUnmarkRecorded(prop)}>
                                <VideoOff />
                                Unmark as Recorded
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onSelect={() => handleRecordVideo(prop)}>
                                <Video />
                                Mark as Recorded
                            </DropdownMenuItem>
                          )}
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
      <TooltipProvider>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-headline">
                Properties
              </h1>
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
            </div>
          </div>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FilterTab)}>
              <TabsList>
                  <TabsTrigger value="All">All</TabsTrigger>
                  <TabsTrigger value="Available">Available</TabsTrigger>
                  <TabsTrigger value="Sold">Sold</TabsTrigger>
                  <TabsTrigger value="Recorded">Recorded</TabsTrigger>
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
      </TooltipProvider>

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
            onUpdateProperty={handleUpdateProperty}
          />
        </>
      )}
    </>
  );
}
