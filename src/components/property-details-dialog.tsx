
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
import { BedDouble, Bath, Car, Ruler, CalendarDays, Tag, Wallet, LandPlot, Building, Briefcase, Link as LinkIcon } from 'lucide-react';

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

const socialIcons = {
    tiktok: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.3-.69.39-1.06.08-.34.04-.7.04-1.06.01-3.49.01-6.98.01-10.46z"/></svg>
    ),
    youtube: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M21.582 7.043c-.23-.836-.9-1.472-1.754-1.693C18.266 5.002 12 5 12 5s-6.266.002-7.828.35c-.854.221-1.524.857-1.754 1.693C2.186 8.691 2 12 2 12s.186 3.309.418 4.957c.23.836.9 1.472 1.754 1.693C5.734 18.998 12 19 12 19s6.266-.002 7.828-.35c.854.221 1.524.857 1.754-1.693C21.814 15.309 22 12 22 12s-.186-3.309-.418-4.957zM10 14.59V9.41L14 12l-4 2.59z"/></svg>
    ),
    instagram: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.069-1.645-.069-4.85s.011-3.584.069-4.85c.149-3.225 1.664-4.771 4.919-4.919C8.416 2.175 8.796 2.163 12 2.163zm0 1.8a9.728 9.728 0 00-4.85.07C4.095 4.195 2.65 5.64 2.451 8.813c-.057 1.259-.068 1.63-.068 4.187s.011 2.928.068 4.187c.199 3.173 1.645 4.618 4.813 4.813 1.259.057 1.63.068 4.187.068s2.928-.011 4.187-.068c3.173-.199 4.618-1.645 4.813-4.813.057-1.259.068-1.63.068-4.187s-.011-2.928-.068-4.187c-.199-3.173-1.645-4.618-4.813-4.813C14.928 4.011 14.558 4 12 4zm0 2.882a5.118 5.118 0 100 10.236 5.118 5.118 0 000-10.236zM12 15a3 3 0 110-6 3 3 0 010 6zm6.406-9.15a1.288 1.288 0 100 2.576 1.288 1.288 0 000-2.576z"/></svg>
    ),
    facebook: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.31 11.9h-2.29v7.1h-3.12v-7.1H8.5V9.61h1.4V8.11c0-1.29.6-3.11 3.11-3.11h2.24v2.3h-1.63c-.43 0-.8.25-.8.74v1.57h2.46l-.37 2.29z"/></svg>
    ),
    other: (<LinkIcon />)
};


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

  const hasVideoLinks = property.video_links && Object.values(property.video_links).some(link => !!link);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="font-headline text-2xl">{property.auto_title}</DialogTitle>
                <DialogDescription>
                  {property.address}
                </DialogDescription>
              </div>
              <Badge variant={property.status === 'Sold' ? 'default' : 'secondary'} className={property.status === 'Sold' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}>{property.status}</Badge>
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
                    <p className="text-sm">{property.documents || 'N/A'}</p>
                  </div>
                </div>
              </div>

               {hasVideoLinks && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-bold text-lg mb-4">Video Links</h3>
                    <div className="flex items-center gap-4">
                      {Object.entries(property.video_links || {}).map(([platform, link]) => {
                        if (!link) return null;
                        const platformKey = platform as keyof typeof socialIcons;
                        return (
                          <a key={platform} href={link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                            {socialIcons[platformKey] || <LinkIcon />}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

            </div>
          </ScrollArea>
          <DialogFooter className="border-t pt-4">
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

    

    
