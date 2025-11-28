
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
import { Property, PriceUnit } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { SharePropertyDialog } from './share-property-dialog';
import { useState } from 'react';
import { BedDouble, Bath, Car, Ruler, CalendarDays, Tag, Wallet, LandPlot, Building, Briefcase, Link as LinkIcon, Video, Percent, User, CircleDollarSign } from 'lucide-react';
import { VideoLinksDialog } from './video-links-dialog';
import { useCurrency } from '@/context/currency-context';
import { formatCurrency, formatUnit } from '@/lib/formatters';

interface PropertyDetailsDialogProps {
  property: Property;
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

export function PropertyDetailsDialog({
  property,
  isOpen,
  setIsOpen,
}: PropertyDetailsDialogProps) {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isVideoLinksOpen, setIsVideoLinksOpen] = useState(false);
  const [shareMode, setShareMode] = useState<'copy' | 'share'>('share');
  const { currency } = useCurrency();


  if (!property) return null;
  
  const formatPrice = (amount?: number, unit?: PriceUnit) => {
    if (!amount || !unit) return 'N/A';
    const valueInPkr = formatUnit(amount, unit);
    return formatCurrency(valueInPkr, currency);
  }

  const handleOpenShareDialog = (mode: 'copy' | 'share') => {
    setShareMode(mode);
    setIsShareOpen(true);
  }

  const hasVideoLinks = property.is_recorded && property.video_links && Object.values(property.video_links).some(link => !!link);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Sold':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'Rent Out':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      default:
        return 'bg-primary text-primary-foreground hover:bg-primary/90';
    }
  };


  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="font-headline text-2xl">{property.auto_title}</DialogTitle>
                <div className="mt-1">
                    <div className="text-xs font-semibold text-muted-foreground">Address</div>
                    <DialogDescription>
                      {property.address}
                    </DialogDescription>
                </div>
              </div>
              <Badge 
                className={getStatusBadgeClass(property.status)}
              >
                {property.status}
              </Badge>
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-6">
            <div className="space-y-6 py-4">

              <div className="p-4 rounded-lg bg-muted/50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <DetailItem icon={<Tag />} label="Serial No" value={<Badge variant="outline" className="font-mono">{property.serial_no}</Badge>} />
                      <DetailItem icon={<CalendarDays />} label="Date Added" value={new Date(property.created_at).toLocaleDateString()} />
                      <DetailItem icon={<Ruler />} label="Size" value={`${property.size_value} ${property.size_unit}`} />
                      <DetailItem icon={<Building />} label="Type" value={property.property_type} />
                  </div>
              </div>
              
              <Separator />

              <div>
                  <h3 className="font-bold text-lg mb-4">Property Specification</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <DetailItem icon={<LandPlot />} label="Front" value={property.front_ft ? `${property.front_ft} ft` : 'N/A'} />
                    <DetailItem icon={<LandPlot style={{transform: 'rotate(90deg)'}}/>} label="Length" value={property.length_ft ? `${property.length_ft} ft` : 'N/A'} />
                    <DetailItem icon={<Ruler />} label="Road Size" value={property.road_size_ft ? `${property.road_size_ft} ft` : 'N/A'} />
                    <DetailItem icon={<Building />} label="Storey" value={property.storey} />
                  </div>
              </div>
              
              <Separator />

              <div>
                <h3 className="font-bold text-lg mb-4">Financials</h3>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <DetailItem icon={<Wallet />} label="Demand" value={formatPrice(property.demand_amount, property.demand_unit)} />
                    <DetailItem icon={<Briefcase />} label="Potential Rent" value={formatPrice(property.potential_rent_amount, property.potential_rent_unit)} />
                 </div>
              </div>
              
              {property.status === 'Sold' && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-bold text-lg mb-4">Sale Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <DetailItem icon={<Wallet />} label="Sold Price" value={formatCurrency(property.sold_price || 0, currency)} />
                      <DetailItem icon={<CircleDollarSign />} label="Total Commission" value={formatCurrency(property.total_commission || 0, currency)} />
                      <DetailItem icon={<Percent />} label="Agent Share" value={`${property.agent_share_percentage || 0}%`} />
                      <DetailItem icon={<User />} label="Sold By" value={property.sold_by_agent_id} />
                       <DetailItem icon={<CalendarDays />} label="Sale Date" value={property.sale_date ? new Date(property.sale_date).toLocaleDateString() : 'N/A'} />
                    </div>
                  </div>
                </>
              )}
               
              <Separator />

              <div>
                <h3 className="font-bold text-lg mb-4">Utilities & Documents</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Meters</h4>
                    <div className="flex flex-col space-y-1 text-sm">
                      {property.meters?.electricity ? <span className="flex items-center gap-2">- Electricity</span> : <span className="flex items-center gap-2 text-muted-foreground">- No Electricity</span>}
                      {property.meters?.gas ? <span className="flex items-center gap-2">- Gas</span> : <span className="flex items-center gap-2 text-muted-foreground">- No Gas</span>}
                      {property.meters?.water ? <span className="flex items-center gap-2">- Water</span> : <span className="flex items-center gap-2 text-muted-foreground">- No Water</span>}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Documents</h4>
                    <div className="text-sm">{property.documents || 'N/A'}</div>
                  </div>
                </div>
              </div>

            </div>
          </ScrollArea>
          <DialogFooter className="border-t pt-4 sm:justify-between">
            <div className="flex gap-2">
                {hasVideoLinks && (
                    <Button variant="outline" onClick={() => setIsVideoLinksOpen(true)}>
                        <Video className="mr-2 h-4 w-4" />
                        Video
                    </Button>
                )}
            </div>
            <div className="flex gap-2">
                <Button variant="secondary" onClick={() => handleOpenShareDialog('copy')}>
                  Copy
                </Button>
                <Button onClick={() => handleOpenShareDialog('share')}>Share</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <SharePropertyDialog property={property} isOpen={isShareOpen} setIsOpen={setIsShareOpen} mode={shareMode} />
      {hasVideoLinks && (
        <VideoLinksDialog 
            property={property}
            isOpen={isVideoLinksOpen}
            setIsOpen={setIsVideoLinksOpen}
        />
      )}
    </>
  );
}
