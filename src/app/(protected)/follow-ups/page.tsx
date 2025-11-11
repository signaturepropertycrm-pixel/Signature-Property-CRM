
'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { followUps as initialFollowUps, buyers as initialBuyers, appointments as initialAppointments } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, MessageSquare, CalendarPlus, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FollowUp, Buyer, Appointment, AppointmentContactType, BuyerStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { BuyerDetailsDialog } from '@/components/buyer-details-dialog';
import { SetAppointmentDialog } from '@/components/set-appointment-dialog';
import { AddFollowUpDialog } from '@/components/add-follow-up-dialog';


export default function FollowUpsPage() {
  const [followUpsData, setFollowUpsData] = useState<FollowUp[]>([]);
  const [buyersData, setBuyersData] = useState<Buyer[]>([]);
  const [appointmentsData, setAppointmentsData] = useState<Appointment[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [buyerForFollowUp, setBuyerForFollowUp] = useState<Buyer | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [isFollowUpOpen, setIsFollowUpOpen] useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState<{ contactType: AppointmentContactType; contactName: string; contactSerialNo?: string; message: string; } | null>(null);
  const { toast } = useToast();

  const loadData = () => {
    const savedFollowUps = localStorage.getItem('followUps');
    setFollowUpsData(savedFollowUps ? JSON.parse(savedFollowUps) : initialFollowUps);
    
    const savedBuyers = localStorage.getItem('buyers');
    setBuyersData(savedBuyers ? JSON.parse(savedBuyers) : initialBuyers);

    const savedAppointments = localStorage.getItem('appointments');
    setAppointmentsData(savedAppointments ? JSON.parse(savedAppointments) : initialAppointments);
  };
  
  useEffect(() => {
    loadData();
    const handleStorageChange = () => loadData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
      if (buyersData.length > 0) localStorage.setItem('buyers', JSON.stringify(buyersData));
  }, [buyersData]);

  useEffect(() => {
      // Allow saving an empty array to clear follow-ups
      localStorage.setItem('followUps', JSON.stringify(followUpsData));
  }, [followUpsData]);

  useEffect(() => {
      if (appointmentsData.length > 0) localStorage.setItem('appointments', JSON.stringify(appointmentsData));
  }, [appointmentsData]);
  
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
      e.stopPropagation(); 
      if (phone) {
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

  const handleSetAppointment = (e: React.MouseEvent, followUp: FollowUp) => {
      e.stopPropagation();
      const buyer = buyersData.find(b => b.id === followUp.buyerId);
      if (buyer) {
          setAppointmentDetails({
              contactType: 'Buyer',
              contactName: buyer.name,
              contactSerialNo: buyer.serial_no,
              message: `Follow-up regarding interest in ${buyer.area_preference || 'general properties'}.`, 
          });
          setIsAppointmentOpen(true);
      }
  };

  const handleSaveAppointment = (appointment: Appointment) => {
      setAppointmentsData(prev => [appointment, ...prev]);
  };
  
  const handleOpenStatusUpdate = (e: React.MouseEvent, followUp: FollowUp) => {
      e.stopPropagation();
      const buyer = buyersData.find(b => b.id === followUp.buyerId);
      if (buyer) {
          setBuyerForFollowUp(buyer);
          setIsFollowUpOpen(true);
      }
  };

  const handleSaveFollowUp = (buyerId: string, notes: string, nextReminder: string) => {
        const buyer = buyersData.find(b => b.id === buyerId);
        if (!buyer) return;

        const newFollowUp: FollowUp = {
            id: `FU-${Date.now()}`,
            buyerId: buyer.id,
            buyerName: buyer.name,
            buyerPhone: buyer.phone,
            propertyInterest: buyer.area_preference || 'General',
            lastContactDate: new Date().toISOString(),
            nextReminder: nextReminder,
            status: 'Scheduled',
            notes: notes,
        };
        
        setFollowUpsData(prev => [...prev.filter(fu => fu.buyerId !== buyerId), newFollowUp]);
        setBuyersData(prev => prev.map(b => b.id === buyerId ? { ...b, status: 'Follow Up', last_follow_up_note: notes } : b));
        
        toast({
            title: "Follow-up Scheduled",
            description: `A follow-up has been created for ${buyer.name}.`
        });

        setIsFollowUpOpen(false);
        setBuyerForFollowUp(null);
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
                    <Badge variant="secondary">
                      Scheduled
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
                  <Button variant="outline" size="icon" onClick={(e) => handleOpenStatusUpdate(e, followUp)}><CalendarPlus /></Button>
                  <Button size="icon" onClick={(e) => handleSetAppointment(e, followUp)}><CheckCircle /></Button>
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
      {appointmentDetails && (
          <SetAppointmentDialog
              isOpen={isAppointmentOpen}
              setIsOpen={setIsAppointmentOpen}
              onSave={handleSaveAppointment}
              appointmentDetails={appointmentDetails}
          />
      )}
      {buyerForFollowUp && (
          <AddFollowUpDialog
              isOpen={isFollowUpOpen}
              setIsOpen={setIsFollowUpOpen}
              buyer={buyerForFollowUp}
              onSave={handleSaveFollowUp}
          />
      )}
    </>
  );
}

    