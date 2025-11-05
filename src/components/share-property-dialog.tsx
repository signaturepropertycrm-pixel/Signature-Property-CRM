
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Property } from '@/lib/types';
import { Copy, Share2, Check } from 'lucide-react';

interface SharePropertyDialogProps {
  property: Property;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const formatForCustomer = (property: Property): string => {
  const parts = [
    '*PROPERTY DETAILS 🏡*',
    `Serial No: ${property.serial_no}`,
    `Area: ${property.area}`,
    `Property Type: ${property.property_type}`,
    `Size/Marla: ${property.size_value} ${property.size_unit}`,
  ];

  if (property.storey) parts.push(`Floor: ${property.storey}`);
  if (property.road_size_ft) parts.push(`Road Size: ${property.road_size_ft} ft`);
  if (property.front_ft) parts.push(`Front/Length: ${property.front_ft} ft`);
  parts.push(`Demand: ${property.demand_amount} ${property.demand_unit}`);
  
  parts.push('\n*Financials:*');
  if (property.potential_rent_amount) {
    parts.push(`- Potential Rent: ${property.potential_rent_amount}K`);
  } else {
    parts.push('- Potential Rent: N/A');
  }

  parts.push('\n*Utilities:*');
  const utilities = [];
  if (property.meters?.gas) utilities.push('_- Gas_');
  if (property.meters?.electricity) utilities.push('_- Electricity_');
  if (property.meters?.water) utilities.push('_- Water_');
  if (utilities.length > 0) {
    parts.push(...utilities);
  } else {
    parts.push('No utilities listed.');
  }

  parts.push(`\n*Documents:* ${property.documents || 'N/A'}`);

  return parts.join('\n');
};

const formatForAgent = (property: Property): string => {
    const parts = [
    '*PROPERTY DETAILS 🏡*',
    `Serial No: ${property.serial_no}`,
    `Area: ${property.area}`,
    `Full Address: ${property.address}`,
    `Property Type: ${property.property_type}`,
    `Size/Marla: ${property.size_value} ${property.size_unit}`,
  ];

  if (property.storey) parts.push(`Floor: ${property.storey}`);
  if (property.road_size_ft) parts.push(`Road Size: ${property.road_size_ft} ft`);
  if (property.front_ft) parts.push(`Front/Length: ${property.front_ft} ft`);
  parts.push(`Demand: ${property.demand_amount} ${property.demand_unit}`);
  parts.push(`Owner Number: ${property.owner_number}`);
  
  parts.push('\n*Financials:*');
  if (property.potential_rent_amount) {
    parts.push(`- Potential Rent: ${property.potential_rent_amount}K`);
  } else {
    parts.push('- Potential Rent: N/A');
  }

  parts.push('\n*Utilities:*');
  const utilities = [];
  if (property.meters?.gas) utilities.push('_- Gas_');
  if (property.meters?.electricity) utilities.push('_- Electricity_');
  if (property.meters?.water) utilities.push('_- Water_');
  if (utilities.length > 0) {
    parts.push(...utilities);
  } else {
    parts.push('No utilities listed.');
  }

  parts.push(`\n*Documents:* ${property.documents || 'N/A'}`);

  return parts.join('\n');
};

export function SharePropertyDialog({
  property,
  isOpen,
  setIsOpen,
}: SharePropertyDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState<'customer' | 'agent' | null>(null);

  const customerText = formatForCustomer(property);
  const agentText = formatForAgent(property);

  const handleCopy = (text: string, type: 'customer' | 'agent') => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleShare = async (text: string) => {
    try {
        if (navigator.share) {
            await navigator.share({
                title: property.auto_title,
                text: text,
            });
        } else {
            handleCopy(text, 'customer'); // Fallback
            toast({ title: 'Link copied!', description: "Sharing not supported, text copied to clipboard."});
        }
    } catch (error) {
        console.error('Sharing failed', error);
        toast({ variant: 'destructive', title: 'Could not share', description: 'There was an error trying to share.'});
    }
  };


  return (
    <Dialog
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">
            Share Property: {property.auto_title}
          </DialogTitle>
        </DialogHeader>

          <Tabs defaultValue="customer">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customer">For Customer</TabsTrigger>
              <TabsTrigger value="agent">For Agent</TabsTrigger>
            </TabsList>
            <TabsContent value="customer">
              <Textarea
                readOnly
                value={customerText}
                className="h-60 mt-4"
              />
              <div className="flex gap-2 mt-4">
                 <Button className="w-full" onClick={() => handleCopy(customerText, 'customer')}>
                    {copied === 'customer' ? <Check className="mr-2" /> : <Copy className="mr-2" />}
                    {copied === 'customer' ? 'Copied' : 'Copy'}
                </Button>
                <Button className="w-full" variant="outline" onClick={() => handleShare(customerText)}>
                    <Share2 className="mr-2" /> Share
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="agent">
              <Textarea
                readOnly
                value={agentText}
                className="h-60 mt-4"
              />
               <div className="flex gap-2 mt-4">
                 <Button className="w-full" onClick={() => handleCopy(agentText, 'agent')}>
                    {copied === 'agent' ? <Check className="mr-2" /> : <Copy className="mr-2" />}
                    {copied === 'agent' ? 'Copied' : 'Copy'}
                </Button>
                <Button className="w-full" variant="outline" onClick={() => handleShare(agentText)}>
                    <Share2 className="mr-2" /> Share
                </Button>
              </div>
            </TabsContent>
          </Tabs>

        <DialogFooter className="sm:justify-start">
           <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    
