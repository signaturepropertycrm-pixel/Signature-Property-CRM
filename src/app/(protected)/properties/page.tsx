
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
import { properties } from '@/lib/data';
import { AddPropertyDialog } from '@/components/add-property-dialog';
import { Input } from '@/components/ui/input';
import type { Property } from '@/lib/types';
import { useState } from 'react';
import { PropertyDetailsDialog } from '@/components/property-details-dialog';
import { MarkAsSoldDialog } from '@/components/mark-as-sold-dialog';
import { RecordVideoDialog } from '@/components/record-video-dialog';
import { Card, CardContent } from '@/components/ui/card';

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

export default function PropertiesPage() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSoldOpen, setIsSoldOpen] = useState(false);
  const [isRecordVideoOpen, setIsRecordVideoOpen] = useState(false);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);

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
               <Input placeholder="Search area, size, demand..." className="w-full pl-10 rounded-full bg-input/80" />
             </div>
            <Button variant="outline" className="rounded-full">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
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

    