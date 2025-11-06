
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
import { Buyer, PriceUnit, SizeUnit } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Home, Tag, Wallet, Ruler, Phone, Mail, FileText, Bookmark, CalendarDays } from 'lucide-react';

interface BuyerDetailsDialogProps {
  buyer: Buyer;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 text-primary">{icon}</div>
        <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="font-semibold">{value || 'N/A'}</div>
        </div>
    </div>
);

const statusVariant = {
    'New': 'default',
    'Contacted': 'secondary',
    'Interested': 'default',
    'Not Interested': 'destructive',
    'Follow Up': 'default',
    'Pending Response': 'secondary',
    'Need More Info': 'secondary',
    'Visited Property': 'secondary',
    'Deal Closed': 'default',
    'Hot Lead': 'default',
    'Cold Lead': 'secondary'
} as const;

function formatBudget(minAmount?: number, minUnit?: PriceUnit, maxAmount?: number, maxUnit?: PriceUnit) {
    if (!minAmount || !minUnit) {
        return 'N/A';
    }
    if (!maxAmount || !maxUnit || (minAmount === maxAmount && minUnit === maxUnit)) {
        return `${minAmount} ${minUnit}`;
    }
    return `${minAmount} ${minUnit} - ${maxAmount} ${maxUnit}`;
}

function formatSize(minAmount?: number, minUnit?: SizeUnit, maxAmount?: number, maxUnit?: SizeUnit) {
    if (!minAmount || !minUnit) {
        return 'N/A';
    }
     if (!maxAmount || !maxUnit || (minAmount === maxAmount && minUnit === maxUnit)) {
        return `${minAmount} ${minUnit}`;
    }
    return `${minAmount} - ${maxAmount} ${maxUnit}`;
}


export function BuyerDetailsDialog({
  buyer,
  isOpen,
  setIsOpen,
}: BuyerDetailsDialogProps) {

  if (!buyer) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="font-headline text-2xl">{buyer.name}</DialogTitle>
                <DialogDescription>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="default" className="font-mono bg-primary/20 text-primary hover:bg-primary/30">{buyer.serial_no}</Badge>
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3" /> {new Date(buyer.created_at).toLocaleDateString()}</span>
                  </div>
                </DialogDescription>
              </div>
               <Badge 
                    variant={buyer.status === 'Follow Up' ? 'default' : statusVariant[buyer.status]} 
                    className={
                        `capitalize ${buyer.status === 'Interested' || buyer.status === 'Hot Lead' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 
                        buyer.status === 'New' ? 'bg-green-600 hover:bg-green-700 text-white' :
                        buyer.status === 'Not Interested' ? 'bg-red-600 hover:bg-red-700 text-white' :
                        buyer.status === 'Deal Closed' ? 'bg-slate-800 hover:bg-slate-900 text-white' : ''}`
                    }
                >
                    {buyer.status}
                </Badge>
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-6">
            <div className="space-y-6 py-4">

              <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-bold text-lg mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <DetailItem icon={<Phone />} label="Phone Number" value={buyer.phone} />
                      <DetailItem icon={<Mail />} label="Email Address" value={buyer.email} />
                  </div>
              </div>
              
              <Separator />

              <div>
                  <h3 className="font-bold text-lg mb-4">Buyer Requirements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DetailItem icon={<Home />} label="Area Preference" value={buyer.area_preference} />
                    <DetailItem icon={<Tag />} label="Property Type" value={buyer.property_type_preference} />
                    <DetailItem icon={<Wallet />} label="Budget" value={formatBudget(buyer.budget_min_amount, buyer.budget_min_unit, buyer.budget_max_amount, buyer.budget_max_unit)} />
                    <DetailItem icon={<Ruler />} label="Size" value={formatSize(buyer.size_min_value, buyer.size_min_unit, buyer.size_max_value, buyer.size_max_unit)} />
                  </div>
              </div>
               
              <Separator />

              <div>
                <h3 className="font-bold text-lg mb-4">Additional Notes</h3>
                 <div className="grid grid-cols-1 gap-6">
                    <DetailItem icon={<FileText />} label="Notes / Other Requirements" value={<p className="whitespace-pre-wrap">{buyer.notes || 'No notes provided.'}</p>} />
                 </div>
              </div>

            </div>
          </ScrollArea>
          <DialogFooter className="border-t pt-4">
             <Button variant="secondary" onClick={() => setIsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
