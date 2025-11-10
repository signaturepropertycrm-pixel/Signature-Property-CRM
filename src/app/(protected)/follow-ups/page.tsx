
'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { followUps as initialFollowUps, buyers as initialBuyers } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, MessageSquare, CalendarPlus, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FollowUp, Buyer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { BuyerDetailsDialog } from '@/components/buyer-details-dialog';


const statusConfig = {
  'Due Soon': { variant: 'destructive', label: 'Due Soon' },
  'Completed': { variant: 'default', label: 'Completed' },
  'Scheduled': { variant: 'secondary', label: 'Scheduled' },
} as const;

export default function FollowUpsPage() {
  const [followUpsData, setFollowUpsData] = useState<FollowUp[]>([]);
  const [buyersData, setBuyersData] = useState<Buyer[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedFollowUps = localStorage.getItem('followUps');
    if (savedFollowUps) {
      setFollowUpsData(JSON.parse(savedFollowUps));
    } else {
      setFollowUpsData(initialFollowUps);
    }
    
    const savedBuyers = localStorage.getItem('buyers');
    if (savedBuyers) {
      setBuyersData(JSON.parse(savedBuyers));
    } else {
      setBuyersData(initialBuyers);
    }
  }, []);
  
  const handlePhoneClick = (phone?: string) => {
    if (phone) {
        toast({
            title: "Buyer's Phone Number",
            description: phone,
        });
    } else {
        toast({
            title: "Phone Number Not Available",
            variant: "destructive",
        });
    }
  };

  const handleCardClick = (buyerId: string) => {
    const buyer = buyersData.find(b => b.id === buyerId);
    if (buyer) {
      setSelectedBuyer(buyer);
      setIsDetailsOpen(true);
    } else {
      toast({
        title: 'Buyer not found',
        description: 'Could not find the details for this buyer.',
        variant: 'destructive',
      });
    }
  };

  const handleWhatsAppClick = (e: React.MouseEvent, phone?: string) => {
      e.stopPropagation(); // Prevent card click event
      if (phone) {
        // Remove +, spaces, and leading zeros from the number, then prepend country code if missing
        let sanitizedPhone = phone.replace(/\s+/g, '').replace(/^\+|^00/, '');
        if (!sanitizedPhone.startsWith('92')) {
            sanitizedPhone = `92${sanitizedPhone.replace(/^0/, '')}`;
        }
        const whatsappUrl = `https://wa.me/${sanitizedPhone}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast({
            title: "Phone Number Not Available",
            variant: "destructive",
        });
      }
  };


  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Follow-ups</h1>
          <p className="text-muted-foreground">Track and manage your follow-ups.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {followUpsData.length === 0 ? (
            <p className="text-muted-foreground col-span-full text-center py-10">No follow-ups scheduled.</p>
          ) : (
            followUpsData.map((followUp) => (
              <Card key={followUp.id} className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleCardClick(followUp.buyerId)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-headline text-lg">{followUp.buyerName}</CardTitle>
                      <CardDescription>{followUp.propertyInterest}</CardDescription>
                    </div>
                    <Badge variant={statusConfig[followUp.status].variant}>
                      {statusConfig[followUp.status].label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Last Contact:</strong> {new Date(followUp.lastContactDate).toLocaleDateString()}</p>
                    <p><strong>Next Reminder:</strong> {new Date(followUp.nextReminder).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm border-t pt-3">{followUp.notes}</p>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); handlePhoneClick(followUp.buyerPhone); }}><Phone /></Button>
                  <Button variant="outline" size="icon" onClick={(e) => handleWhatsAppClick(e, followUp.buyerPhone)}><MessageSquare /></Button>
                  <Button variant="outline" size="icon" onClick={(e) => e.stopPropagation()}><CalendarPlus /></Button>
                  <Button size="icon" onClick={(e) => e.stopPropagation()}><CheckCircle /></Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
      {selectedBuyer && (
        <BuyerDetailsDialog 
          buyer={selectedBuyer}
          isOpen={isDetailsOpen}
          setIsOpen={setIsDetailsOpen}
        />
      )}
    </>
  );
}
