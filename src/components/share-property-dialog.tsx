
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
    mode: 'copy' | 'share';
}

const generateSimpleShareableText = (property: Property) => {
    if (!property) return { forCustomer: '', forAgent: '' };

    const details = {
        serialNo: `Serial No: ${property.serial_no}`,
        area: `Area: ${property.area}`,
        propertyType: `Property Type: ${property.property_type}`,
        size: `Size/Marla: ${property.size_value} ${property.size_unit}`,
        storey: property.storey ? `Floor: ${property.storey}` : null,
        roadSize: property.road_size_ft ? `Road Size: ${property.road_size_ft}ft` : null,
        front: property.front_ft ? `Front/Length: ${property.front_ft}ft` : null,
        demand: `Demand: ${property.demand_amount} ${property.demand_unit}`,
        address: `Full Address: ${property.address}`,
        ownerNumber: `Owner Number: ${property.owner_number}`,
        potentialRent: property.potential_rent_amount ? `- Potential Rent: ${property.potential_rent_amount}K` : '- Potential Rent: N/A',
        documents: `Documents: ${property.documents || 'N/A'}`
    };

    const utilities = [
        property.meters?.gas && '*- Gas*',
        property.meters?.electricity && '*- Electricity*',
        property.meters?.water && '*- Water*'
    ].filter(Boolean).join('\n') || 'No utilities listed.';

    // Customer Text
    const customerTextParts = [
        '*PROPERTY DETAILS 🏡*',
        details.serialNo,
        details.area,
        details.propertyType,
        details.size,
        details.storey,
        details.roadSize,
        details.front,
        details.demand,
        '\n*Financials:*',
        details.potentialRent,
        '\n*Utilities:*',
        utilities,
        '\n*Documents:*',
        details.documents,
    ];
    const forCustomer = customerTextParts.filter(Boolean).join('\n');

    // Agent Text
    const agentTextParts = [
        '*PROPERTY DETAILS 🏡*',
        details.serialNo,
        details.area,
        details.address,
        details.propertyType,
        details.size,
        details.storey,
        details.roadSize,
        details.front,
        details.demand,
        details.ownerNumber,
        '\n*Financials:*',
        details.potentialRent,
        '\n*Utilities:*',
        utilities,
        '\n*Documents:*',
        details.documents,
    ];
    const forAgent = agentTextParts.filter(Boolean).join('\n');

    return { forCustomer, forAgent };
};


export function SharePropertyDialog({
  property,
  isOpen,
  setIsOpen,
  mode
}: SharePropertyDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState<'customer' | 'agent' | null>(null);
  const [customerText, setCustomerText] = useState('');
  const [agentText, setAgentText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && property) {
        setLoading(true);
        const { forCustomer, forAgent } = generateSimpleShareableText(property);
        setCustomerText(forCustomer);
        setAgentText(forAgent);
        setLoading(false);
    }
  }, [isOpen, property]);


  const handleCopy = (text: string, type: 'customer' | 'agent') => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleShare = async (text: string) => {
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };


  return (
    <Dialog
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">
            {mode === 'copy' ? 'Copy Details' : 'Share Property'}: {property.auto_title}
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
                disabled={loading}
              />
              <div className="flex gap-2 mt-4">
                 {mode === 'copy' ? (
                    <Button className="w-full" onClick={() => handleCopy(customerText, 'customer')} disabled={loading}>
                        {copied === 'customer' ? <Check className="mr-2" /> : <Copy className="mr-2" />}
                        {copied === 'customer' ? 'Copied' : 'Copy Text'}
                    </Button>
                 ) : (
                    <Button className="w-full" variant="outline" onClick={() => handleShare(customerText)} disabled={loading}>
                        <Share2 className="mr-2" /> Share on WhatsApp
                    </Button>
                 )}
              </div>
            </TabsContent>
            <TabsContent value="agent">
              <Textarea
                readOnly
                value={agentText}
                className="h-60 mt-4"
                disabled={loading}
              />
               <div className="flex gap-2 mt-4">
                 {mode === 'copy' ? (
                    <Button className="w-full" onClick={() => handleCopy(agentText, 'agent')} disabled={loading}>
                        {copied === 'agent' ? <Check className="mr-2" /> : <Copy className="mr-2" />}
                        {copied === 'agent' ? 'Copied' : 'Copy Text'}
                    </Button>
                 ) : (
                    <Button className="w-full" variant="outline" onClick={() => handleShare(agentText)} disabled={loading}>
                        <Share2 className="mr-2" /> Share on WhatsApp
                    </Button>
                 )}
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
