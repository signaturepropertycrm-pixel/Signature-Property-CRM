
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
import { ClipboardCopy, ClipboardCheck, Settings, FileText } from 'lucide-react';
import { Input } from './ui/input';

interface ListGeneratorToolProps {
  allProperties: Property[];
}

type SelectableField = 'area' | 'address' | 'size' | 'demand' | 'property_type' | 'status';

const fieldLabels: Record<SelectableField, string> = {
  area: 'Area',
  address: 'Full Address',
  size: 'Size',
  demand: 'Demand',
  property_type: 'Property Type',
  status: 'Status',
};

export function ListGeneratorTool({ allProperties }: ListGeneratorToolProps) {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [selectedFields, setSelectedFields] = useState<SelectableField[]>([
    'area',
    'size',
    'demand',
    'property_type',
  ]);
  const [areaFilter, setAreaFilter] = useState('');
  const [generatedList, setGeneratedList] = useState('');
  const [copied, setCopied] = useState(false);

  const handleFieldChange = (field: SelectableField) => {
    setSelectedFields((prev) =>
      prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field]
    );
  };

  const convertToMarla = (value: number, unit: string) => {
    switch (unit) {
      case 'Kanal':
        return value * 20;
      case 'Acre':
        return value * 160;
      case 'Maraba':
        return value * 400; // 1 Maraba = 25 Acres = 400 Kanals
       case 'SqFt':
         return value / 272.251; // Standard Marla size
      default:
        return value;
    }
  }

  const generateList = () => {
    const filtered = allProperties.filter(
      (p) =>
        p.status === 'Available' &&
        (!areaFilter || p.area.toLowerCase().includes(areaFilter.toLowerCase()))
    );
    
    // Sort by size (largest to smallest), converting all sizes to a common unit (Marla) for comparison
    const sorted = filtered.sort((a, b) => {
        const sizeA = convertToMarla(a.size_value, a.size_unit);
        const sizeB = convertToMarla(b.size_value, b.size_unit);
        return sizeB - sizeA;
    });

    let listString = `*${profile.agencyName}*\n`;
    listString += `*Date:* ${new Date().toLocaleDateString('en-GB')}\n\n`;

    if (sorted.length === 0) {
        listString += "No available properties match the criteria.";
    } else {
        sorted.forEach((p, index) => {
            listString += `*${index + 1}).*\n`;
            
            if (selectedFields.includes('property_type')) {
                listString += `*Type:* ${p.property_type}\n`;
            }
             if (selectedFields.includes('size')) {
                listString += `*Size:* ${p.size_value} ${p.size_unit}\n`;
            }
            if (selectedFields.includes('area')) {
                listString += `*Area:* ${p.area}\n`;
            }
            if (selectedFields.includes('address')) {
                listString += `*Address:* ${p.address}\n`;
            }
            if (selectedFields.includes('demand')) {
                listString += `*Demand:* ${p.demand_amount} ${p.demand_unit}\n`;
            }
            if (selectedFields.includes('status')) {
                listString += `*Status:* ${p.status}\n`;
            }
            listString += '\n';
        });
    }

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
            <FileText />
            List Generator
        </CardTitle>
        <CardDescription>
          Generate a shareable list of available properties for other dealers.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2"><Settings className="h-5 w-5" /> Filters & Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                     <div>
                        <Label htmlFor="area-filter">Filter by Area</Label>
                        <Input 
                            id="area-filter"
                            value={areaFilter}
                            onChange={(e) => setAreaFilter(e.target.value)}
                            placeholder="e.g., DHA, Bahria"
                            className="mt-2"
                        />
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
                </CardContent>
            </Card>
            <Button onClick={generateList} className="w-full">
                Generate List
            </Button>
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="generated-list">Generated List</Label>
          <Textarea
            id="generated-list"
            readOnly
            value={generatedList}
            placeholder="Your generated property list will appear here..."
            className="h-96 text-xs whitespace-pre-wrap"
          />
           <Button onClick={handleCopy} disabled={!generatedList} className="w-full">
            {copied ? <ClipboardCheck /> : <ClipboardCopy />}
            {copied ? 'Copied!' : 'Copy List'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
