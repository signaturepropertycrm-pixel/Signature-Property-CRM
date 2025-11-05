
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
import { generateShareableText } from '@/lib/actions';
import { ShareableTextInput } from '@/ai/flows/shareable-text-generation';


export function SharePropertyDialog({
  property,
  isOpen,
  setIsOpen,
}: SharePropertyDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState<'customer' | 'agent' | null>(null);
  const [customerText, setCustomerText] = useState('');
  const [agentText, setAgentText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && property) {
        setLoading(true);
        const propertyInput: ShareableTextInput = {
            serial_no: property.serial_no,
            area: property.area,
            address: property.address,
            property_type: property.property_type,
            size_value: property.size_value,
            size_unit: property.size_unit,
            storey: property.storey,
            road_size_ft: property.road_size_ft,
            front_ft: property.front_ft,
            length_ft: property.length_ft,
            demand_amount: property.demand_amount,
            demand_unit: property.demand_unit,
            owner_number: property.owner_number,
            potential_rent_amount: property.potential_rent_amount,
            potential_rent_unit: property.potential_rent_unit,
            meters: property.meters,
            documents: property.documents,
        };
        
        generateShareableText(propertyInput)
            .then(res => {
                setCustomerText(res.forCustomer);
                setAgentText(res.forAgent);
            })
            .catch(err => {
                console.error("Failed to generate shareable text:", err);
                toast({
                    variant: 'destructive',
                    title: "AI Text Generation Failed",
                    description: "Could not generate the property description. Please try again."
                });
            })
            .finally(() => setLoading(false));
    }
  }, [isOpen, property, toast]);


  const handleCopy = (text: string, type: 'customer' | 'agent') => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleShare = async (text: string, type: 'customer' | 'agent') => {
    try {
        if (navigator.share) {
            await navigator.share({
                title: property.auto_title,
                text: text,
            });
        } else {
            handleCopy(text, type); 
            toast({ title: 'Sharing not supported', description: "Text copied to clipboard instead."});
        }
    } catch (error) {
        console.error('Sharing failed, falling back to copy:', error);
        handleCopy(text, type);
        toast({ 
            variant: 'destructive', 
            title: 'Sharing Failed', 
            description: 'Could not share. The text has been copied to your clipboard instead.'
        });
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
                value={loading ? "Generating with AI..." : customerText}
                className="h-60 mt-4"
                disabled={loading}
              />
              <div className="flex gap-2 mt-4">
                 <Button className="w-full" onClick={() => handleCopy(customerText, 'customer')} disabled={loading}>
                    {copied === 'customer' ? <Check className="mr-2" /> : <Copy className="mr-2" />}
                    {copied === 'customer' ? 'Copied' : 'Copy'}
                </Button>
                <Button className="w-full" variant="outline" onClick={() => handleShare(customerText, 'customer')} disabled={loading}>
                    <Share2 className="mr-2" /> Share
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="agent">
              <Textarea
                readOnly
                value={loading ? "Generating with AI..." : agentText}
                className="h-60 mt-4"
                disabled={loading}
              />
               <div className="flex gap-2 mt-4">
                 <Button className="w-full" onClick={() => handleCopy(agentText, 'agent')} disabled={loading}>
                    {copied === 'agent' ? <Check className="mr-2" /> : <Copy className="mr-2" />}
                    {copied === 'agent' ? 'Copied' : 'Copy'}
                </Button>
                <Button className="w-full" variant="outline" onClick={() => handleShare(agentText, 'agent')} disabled={loading}>
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
