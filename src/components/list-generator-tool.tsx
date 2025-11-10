
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
import { Property } from '@/lib/types';
import { useProfile } from '@/context/profile-context';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCopy, ClipboardCheck, Settings, FileText, List, SlidersHorizontal, CheckSquare } from 'lucide-react';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

interface ListGeneratorToolProps {
  allProperties: Property[];
}

type SelectableField = 'serial_no' | 'area' | 'address' | 'size' | 'demand' | 'property_type' | 'status' | 'road_size_ft' | 'storey' | 'utilities' | 'documents';

const fieldLabels: Record<SelectableField, string> = {
  serial_no: 'Serial No',
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

export function ListGeneratorTool({ allProperties }: ListGeneratorToolProps) {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [selectedFields, setSelectedFields] = useState<SelectableField[]>([
    'serial_no',
    'area',
    'size',
    'demand',
    'property_type',
  ]);
  const [areaFilter, setAreaFilter] = useState('');
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
    const filtered = allProperties.filter(
      (p) =>
        p.status === 'Available' &&
        (!areaFilter || p.area.toLowerCase().includes(areaFilter.toLowerCase()))
    );
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

    const propertiesToInclude = allProperties
      .filter(p => selectedProperties.includes(p.id))
      .sort((a, b) => b.size_value - a.size_value); // Sort by size descending

    let listString = `*${profile.agencyName}*\n`;
    listString += `*Date:* ${new Date().toLocaleDateString('en-GB')}\n\n`;

    propertiesToInclude.forEach((p, index) => {
      listString += `*${index + 1}).*\n`;
      
      if (selectedFields.includes('serial_no')) {
          listString += `*Serial:* ${p.serial_no}\n`;
      }
      if (selectedFields.includes('property_type')) {
        listString += `*Type:* ${p.property_type}\n`;
      }
      if (selectedFields.includes('size')) {
        listString += `*Size:* ${p.size_value} ${p.size_unit}\n`;
      }
       if (selectedFields.includes('storey')) {
        listString += `*Storey:* ${p.storey || 'N/A'}\n`;
      }
      if (selectedFields.includes('area')) {
        listString += `*Area:* ${p.area}\n`;
      }
      if (selectedFields.includes('address')) {
        listString += `*Address:* ${p.address}\n`;
      }
       if (selectedFields.includes('road_size_ft')) {
        listString += `*Road:* ${p.road_size_ft ? `${p.road_size_ft} ft` : 'N/A'}\n`;
      }
      if (selectedFields.includes('demand')) {
        listString += `*Demand:* ${p.demand_amount} ${p.demand_unit}\n`;
      }
      if (selectedFields.includes('status')) {
        listString += `*Status:* ${p.status}\n`;
      }
      if (selectedFields.includes('utilities')) {
        const utils = [
            p.meters?.electricity && 'Electricity',
            p.meters?.gas && 'Gas',
            p.meters?.water && 'Water'
        ].filter(Boolean).join(', ') || 'N/A';
        listString += `*Utilities:* ${utils}\n`;
      }
      if (selectedFields.includes('documents')) {
        listString += `*Documents:* ${p.documents || 'N/A'}\n`;
      }
      listString += '\n';
    });

    setGeneratedList(listString);
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
                    <div>
                        <Label htmlFor="area-filter">Filter by Area</Label>
                        <form onSubmit={handleFilterProperties} className="flex gap-2 mt-2">
                            <Input 
                                id="area-filter"
                                value={areaFilter}
                                onChange={(e) => setAreaFilter(e.target.value)}
                                placeholder="e.g., DHA, Bahria"
                            />
                            <Button type="submit">Filter</Button>
                        </form>
                    </div>
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
                            {areaFilter ? 'No properties found for this area.' : 'Filter by area to see properties.'}
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
