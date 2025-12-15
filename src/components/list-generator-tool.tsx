
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Property, PropertyType, SizeUnit, PriceUnit } from '@/lib/types';
import { useProfile } from '@/context/profile-context';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCopy, ClipboardCheck, Settings, FileText, List, SlidersHorizontal, CheckSquare } from 'lucide-react';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { formatUnit } from '@/lib/formatters';

interface ListGeneratorToolProps {
  allProperties: Property[];
}

type SelectableField = 'serial_no' | 'owner_number' | 'area' | 'address' | 'size' | 'demand' | 'property_type' | 'status' | 'road_size_ft' | 'storey' | 'utilities' | 'documents';

const fieldLabels: Record<SelectableField, string> = {
  serial_no: 'Serial No',
  owner_number: 'Owner Number',
  area: 'Area',
  address: 'Full Address',
  size: 'Size',
  demand: 'Demand',
  property_type: 'Property Type',
  status: 'Status',
  road_size_ft: 'Road Size',
  storey: 'Storey',
  utilities: 'Utilities',
  documents: 'Documents'
};

const propertyTypesForFilter: (PropertyType | 'All' | 'Other')[] = [
    'All', 'House', 'Flat', 'Farm House', 'Penthouse', 'Plot', 'Residential Plot', 'Commercial Plot', 'Agricultural Land', 'Industrial Land', 'Office', 'Shop', 'Warehouse', 'Factory', 'Building', 'Other'
];
const sizeUnits: SizeUnit[] = ['Marla', 'SqFt', 'Kanal', 'Acre', 'Maraba'];
const demandUnits: PriceUnit[] = ['Lacs', 'Crore'];

export function ListGeneratorTool({ allProperties }: ListGeneratorToolProps) {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [selectedFields, setSelectedFields] = useState<SelectableField[]>([
    'serial_no', 'area', 'address', 'size', 'demand', 'property_type',
    'status', 'road_size_ft', 'storey', 'utilities', 'documents'
  ]);
  const [areaFilter, setAreaFilter] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<PropertyType | 'All' | 'Other'>('All');
  const [otherPropertyTypeFilter, setOtherPropertyTypeFilter] = useState('');
  const [minSizeFilter, setMinSizeFilter] = useState('');
  const [maxSizeFilter, setMaxSizeFilter] = useState('');
  const [sizeUnitFilter, setSizeUnitFilter] = useState<SizeUnit>('Marla');
  const [minDemandFilter, setMinDemandFilter] = useState('');
  const [maxDemandFilter, setMaxDemandFilter] = useState('');
  const [demandUnitFilter, setDemandUnitFilter] = useState<PriceUnit>('Lacs');

  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [generatedList, setGeneratedList] = useState('');
  const [copied, setCopied] = useState(false);

  const handleFieldChange = (field: SelectableField) => {
    setSelectedFields((prev) =>
      prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field]
    );
  };
  
  const handleFilterProperties = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const minDemandBase = minDemandFilter ? formatUnit(parseFloat(minDemandFilter), demandUnitFilter) : 0;
    const maxDemandBase = maxDemandFilter ? formatUnit(parseFloat(maxDemandFilter), demandUnitFilter) : Infinity;

    const filtered = allProperties.filter(p => {
        const demandBase = formatUnit(p.demand_amount, p.demand_unit);

        const areaMatch = !areaFilter || p.area.toLowerCase().includes(areaFilter.toLowerCase());
        
        let typeMatch = true;
        if (propertyTypeFilter !== 'All') {
            if (propertyTypeFilter === 'Other') {
                typeMatch = p.property_type.toLowerCase().includes(otherPropertyTypeFilter.toLowerCase());
            } else {
                typeMatch = p.property_type === propertyTypeFilter;
            }
        }
        
        const minSizeMatch = !minSizeFilter || (p.size_value >= parseFloat(minSizeFilter) && p.size_unit === sizeUnitFilter);
        const maxSizeMatch = !maxSizeFilter || (p.size_value <= parseFloat(maxSizeFilter) && p.size_unit === sizeUnitFilter);
        const minDemandMatch = !minDemandFilter || demandBase >= minDemandBase;
        const maxDemandMatch = !maxDemandFilter || demandBase <= maxDemandBase;
        
        return p.status === 'Available' && areaMatch && typeMatch && minSizeMatch && maxSizeMatch && minDemandMatch && maxDemandMatch;
    });

    setFilteredProperties(filtered);
    setSelectedProperties([]); // Reset selection
    setGeneratedList('');
  }

  const handlePropertySelection = (propertyId: string) => {
    setSelectedProperties((prev) => 
        prev.includes(propertyId) 
            ? prev.filter(id => id !== propertyId) 
            : [...prev, propertyId]
    );
  }

  const handleSelectAll = (checked: boolean) => {
      if (checked) {
          setSelectedProperties(filteredProperties.map(p => p.id));
      } else {
          setSelectedProperties([]);
      }
  }


  const generateList = () => {
    if (selectedProperties.length === 0) {
        toast({
            title: "No Properties Selected",
            description: "Please select at least one property to generate a list.",
            variant: "destructive"
        });
        return;
    }

    const propertiesToInclude = allProperties.filter(p => selectedProperties.includes(p.id));

    // Group properties by type
    const groupedProperties = propertiesToInclude.reduce((acc, property) => {
        const type = property.property_type.toUpperCase() as PropertyType | 'OTHER';
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(property);
        return acc;
    }, {} as Record<string, Property[]>);

    let listString = `*${profile.agencyName}*\n\n`;

    // Iterate over grouped properties
    for (const type in groupedProperties) {
        listString += `*${type}S*\n`; // e.g., *HOUSES*
        
        groupedProperties[type]
            .sort((a, b) => b.size_value - a.size_value) // Sort within group
            .forEach((p, index) => {
                listString += `*${index + 1}).*\n`;
                
                if (selectedFields.includes('serial_no')) listString += `*Serial:* ${p.serial_no}\n`;
                if (selectedFields.includes('owner_number')) listString += `*Number:* ${p.owner_number}\n`;
                if (selectedFields.includes('property_type')) listString += `*Type:* ${p.property_type}\n`;
                if (selectedFields.includes('size')) listString += `*Size:* ${p.size_value} ${p.size_unit}\n`;
                if (selectedFields.includes('storey')) listString += `*Storey:* ${p.storey || 'N/A'}\n`;
                if (selectedFields.includes('area')) listString += `*Area:* ${p.area}\n`;
                if (selectedFields.includes('address')) listString += `*Address:* ${p.address}\n`;
                if (selectedFields.includes('road_size_ft')) listString += `*Road:* ${p.road_size_ft ? `${p.road_size_ft} ft` : 'N/A'}\n`;
                if (selectedFields.includes('demand')) listString += `*Demand:* ${p.demand_amount} ${p.demand_unit}\n`;
                if (selectedFields.includes('status')) listString += `*Status:* ${p.status}\n`;
                if (selectedFields.includes('utilities')) {
                    const utils = [
                        p.meters?.electricity && 'Electricity',
                        p.meters?.gas && 'Gas',
                        p.meters?.water && 'Water'
                    ].filter(Boolean).join(', ') || 'N/A';
                    listString += `*Utilities:* ${utils}\n`;
                }
                if (selectedFields.includes('documents')) listString += `*Documents:* ${p.documents || 'N/A'}\n`;

                listString += '\n';
            });
    }

    setGeneratedList(listString.trim());
    setCopied(false);
};

  const handleCopy = () => {
    if (generatedList) {
      navigator.clipboard.writeText(generatedList);
      toast({
        title: 'List Copied!',
        description: 'The property list has been copied to your clipboard.',
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <List />
            List Generator
        </CardTitle>
        <CardDescription>
          Generate a shareable list of available properties for other dealers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Filters & Options */}
            <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><SlidersHorizontal className="h-5 w-5" />Step 1: Filters & Options</h3>
                <div className="p-4 border rounded-lg space-y-4 bg-muted/30 h-full">
                    <form onSubmit={handleFilterProperties} className="space-y-4">
                         <div>
                            <Label htmlFor="area-filter">Filter by Area</Label>
                            <Input 
                                id="area-filter"
                                value={areaFilter}
                                onChange={(e) => setAreaFilter(e.target.value)}
                                placeholder="e.g., DHA, Bahria"
                                className="mt-1"
                            />
                        </div>
                        <div>
                           <Label>Property Type</Label>
                           <Select value={propertyTypeFilter} onValueChange={(v) => setPropertyTypeFilter(v as any)}>
                               <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                               <SelectContent>{propertyTypesForFilter.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                           </Select>
                           {propertyTypeFilter === 'Other' && (
                                <Input 
                                    value={otherPropertyTypeFilter}
                                    onChange={(e) => setOtherPropertyTypeFilter(e.target.value)}
                                    placeholder="Enter custom type..."
                                    className="mt-2"
                                />
                           )}
                        </div>
                        <div>
                            <Label>Size</Label>
                            <div className="flex gap-2 items-center mt-1">
                                <Input type="number" placeholder="Min" value={minSizeFilter} onChange={e => setMinSizeFilter(e.target.value)} />
                                <Input type="number" placeholder="Max" value={maxSizeFilter} onChange={e => setMaxSizeFilter(e.target.value)} />
                                <Select value={sizeUnitFilter} onValueChange={v => setSizeUnitFilter(v as any)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{sizeUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                         <div>
                            <Label>Demand</Label>
                            <div className="flex gap-2 items-center mt-1">
                                <Input type="number" placeholder="Min" value={minDemandFilter} onChange={e => setMinDemandFilter(e.target.value)} />
                                <Input type="number" placeholder="Max" value={maxDemandFilter} onChange={e => setMaxDemandFilter(e.target.value)} />
                                <Select value={demandUnitFilter} onValueChange={v => setDemandUnitFilter(v as any)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{demandUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button type="submit" className="w-full">Filter Properties</Button>
                    </form>
                    <Separator />
                    <div>
                        <Label>Fields to Include</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                        {(Object.keys(fieldLabels) as SelectableField[]).map((field) => (
                            <div key={field} className="flex items-center space-x-2">
                            <Checkbox
                                id={`field-${field}`}
                                checked={selectedFields.includes(field)}
                                onCheckedChange={() => handleFieldChange(field)}
                            />
                            <Label htmlFor={`field-${field}`} className="text-sm font-normal">
                                {fieldLabels[field]}
                            </Label>
                            </div>
                        ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Column 2: Select Properties */}
            <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><CheckSquare className="h-5 w-5" />Step 2: Select Properties</h3>
                <ScrollArea className="h-80 border rounded-lg p-4 bg-muted/30">
                    {filteredProperties.length > 0 ? (
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2 pb-2 border-b">
                                <Checkbox
                                    id="select-all"
                                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                    checked={selectedProperties.length === filteredProperties.length && filteredProperties.length > 0}
                                />
                                <Label htmlFor="select-all" className="font-semibold">Select All</Label>
                            </div>
                            {filteredProperties.map(prop => (
                                <div key={prop.id} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={prop.id}
                                        checked={selectedProperties.includes(prop.id)}
                                        onCheckedChange={() => handlePropertySelection(prop.id)}
                                    />
                                    <Label htmlFor={prop.id} className="text-sm font-normal cursor-pointer">
                                        {prop.auto_title}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                            {areaFilter || propertyTypeFilter !== 'All' || minSizeFilter || minDemandFilter ? 'No properties found for these filters.' : 'Filter properties to see a list.'}
                        </div>
                    )}
                </ScrollArea>
            </div>
        </div>
        
        <Separator />
        
        {/* Generated List Section */}
        <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><FileText className="h-5 w-5" />Step 3: Generate & Copy List</h3>
            <div className="space-y-2">
                <Textarea
                    id="generated-list"
                    readOnly
                    value={generatedList}
                    placeholder="Your generated property list will appear here..."
                    className="h-80 text-xs whitespace-pre-wrap bg-muted/30"
                />
                <div className="flex gap-2">
                    <Button onClick={generateList} className="w-full">
                        Generate List
                    </Button>
                    <Button onClick={handleCopy} disabled={!generatedList} variant="outline" className="w-full">
                        {copied ? <ClipboardCheck /> : <ClipboardCopy />}
                        {copied ? 'Copied!' : 'Copy List'}
                    </Button>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
