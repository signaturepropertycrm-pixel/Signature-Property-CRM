'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Property } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { SharePropertyDialog } from './share-property-dialog';
import { useState } from 'react';

interface PropertyDetailsDialogProps {
  property: Property;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function PropertyDetailsDialog({
  property,
  isOpen,
  setIsOpen,
}: PropertyDetailsDialogProps) {
  const [isShareOpen, setIsShareOpen] = useState(false);

  if (!property) return null;
  
  const formatPrice = (amount?: number, unit?: string) => {
    if (!amount || !unit) return 'N/A';
    return `${amount} ${unit}`;
  }

  const handleCopy = () => {
    setIsShareOpen(true);
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline">{property.auto_title}</DialogTitle>
            <DialogDescription>
              {property.serial_no} - {property.address}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Status</h4>
                  <Badge>{property.status}</Badge>
                </div>
                <div>
                  <h4 className="font-semibold">Date Added</h4>
                  <p>{new Date(property.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <Separator />

              <h3 className="font-bold text-lg">Property Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold">Property Type</h4>
                  <p>{property.property_type}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Size</h4>
                  <p>{`${property.size_value} ${property.size_unit}`}</p>
                </div>
                 <div>
                  <h4 className="font-semibold">Storey</h4>
                  <p>{property.storey || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Road Size</h4>
                  <p>{property.road_size_ft ? `${property.road_size_ft} ft` : 'N/A'}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Front</h4>
                  <p>{property.front_ft ? `${property.front_ft} ft` : 'N/A'}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Length</h4>
                  <p>{property.length_ft ? `${property.length_ft} ft` : 'N/A'}</p>
                </div>
              </div>

              <Separator />

              <h3 className="font-bold text-lg">Financials</h3>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold">Demand</h4>
                    <p>{formatPrice(property.demand_amount, property.demand_unit)}</p>
                  </div>
                   <div>
                    <h4 className="font-semibold">Potential Rent</h4>
                    <p>{formatPrice(property.potential_rent_amount, property.potential_rent_unit)}</p>
                  </div>
               </div>
               
              <Separator />

              <h3 className="font-bold text-lg">Utilities & Documents</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Meters</h4>
                  <div className="flex flex-col">
                    {property.meters?.electricity && <span>- Electricity</span>}
                    {property.meters?.gas && <span>- Gas</span>}
                    {property.meters?.water && <span>- Water</span>}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold">Documents</h4>
                  <p>{property.documents || 'N/A'}</p>
                </div>
              </div>

               <Separator />
               
               <h3 className="font-bold text-lg">Contact</h3>
                 <div>
                  <h4 className="font-semibold">Owner Number</h4>
                  <p>{property.owner_number}</p>
                </div>

            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={handleCopy}>
              Copy
            </Button>
            <Button onClick={() => setIsShareOpen(true)}>Share</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <SharePropertyDialog property={property} isOpen={isShareOpen} setIsOpen={setIsShareOpen} />
    </>
  );
}
