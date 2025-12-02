
'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, MessageSquare, CalendarPlus, CheckCircle, Clock } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { FollowUp, Buyer, Appointment, AppointmentContactType, Activity } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { BuyerDetailsDialog } from '@/components/buyer-details-dialog';
import { SetAppointmentDialog } from '@/components/set-appointment-dialog';
import { AddFollowUpDialog } from '@/components/add-follow-up-dialog';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/hooks';
import { useProfile } from '@/context/profile-context';
import { formatPhoneNumber } from '@/lib/utils';


export default function FollowUpsPage() {
  const firestore = useFirestore();
  const { profile } = useProfile();

  const followUpsQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'followUps') : null, [profile.agency_id, firestore]);
  const { data: followUpsData, isLoading: isFollowUpsLoading } = useCollection<FollowUp>(followUpsQuery);
  
  const buyersQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'buyers') : null, [profile.agency_id, firestore]);
  const { data: buyersData, isLoading: isBuyersLoading } = useCollection<Buyer>(buyersQuery);
  
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [buyerForFollowUp, setBuyerForFollowUp] = useState<Buyer | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState<{ contactType: AppointmentContactType; contactName: string; contactSerialNo?: string; message: string; } | null>(null);
  const { toast } = useToast();
  
  const logActivity = async (action: string, target: string, targetType: Activity['targetType'], details: any = null) => {
    if (!profile.agency_id) return;
    const activityLogRef = collection(firestore, 'agencies', profile.agency_id, 'activityLogs');
    const newActivity: Omit<Activity, 'id'> = {
      userName: profile.name,
      action,
      target,
      targetType,
      details,
      timestamp: new Date().toISOString(),
      agency_id: profile.agency_id,
    };
    await addDoc(activityLogRef, newActivity);
  };
  
  const handlePhoneClick = (e: React.MouseEvent, phone?: string) => {
    e.stopPropagation();
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
    const buyer = buyersData?.find(b => b.id === buyerId);
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
        const formattedPhone = formatPhoneNumber(phone).replace('+', '');
        const whatsappUrl = `https://wa.me/${formattedPhone}`;
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
      const buyer = buyersData?.find(b => b.id === followUp.buyerId);
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

  const handleSaveAppointment = async (appointment: Appointment) => {
      if (!profile.agency_id) return;
      await addDoc(collection(firestore, 'agencies', profile.agency_id, 'appointments'), appointment);
      await logActivity('scheduled an appointment', appointment.contactName, 'Appointment');
  };
  
  const handleOpenStatusUpdate = (e: React.MouseEvent, followUp: FollowUp) => {
      e.stopPropagation();
      const buyer = buyersData?.find(b => b.id === followUp.buyerId);
      if (buyer) {
          setBuyerForFollowUp(buyer);
          setIsFollowUpOpen(true);
      }
  };

  const handleSaveFollowUp = async (buyerId: string, notes: string, nextReminderDate: string, nextReminderTime: string) => {
        if (!profile.agency_id || !buyersData) return;
        const buyer = buyersData.find(b => b.id === buyerId);
        if (!buyer) return;

        const newFollowUp: Omit<FollowUp, 'id'> = {
            buyerId: buyer.id,
            buyerName: buyer.name,
            buyerPhone: buyer.phone,
            propertyInterest: buyer.area_preference || 'General',
            lastContactDate: new Date().toISOString(),
            nextReminderDate: nextReminderDate,
            nextReminderTime: nextReminderTime,
            status: 'Scheduled',
            notes: notes,
            agency_id: profile.agency_id
        };
        
        const followUpsCollection = collection(firestore, 'agencies', profile.agency_id, 'followUps');
        const existingFollowUp = followUpsData?.find(fu => fu.buyerId === buyerId);
        let action = 'scheduled a follow-up';
        
        if (existingFollowUp) {
            await setDoc(doc(followUpsCollection, existingFollowUp.id), newFollowUp);
            action = 'rescheduled a follow-up';
        } else {
            await addDoc(followUpsCollection, newFollowUp);
        }
        
        await logActivity(action, buyer.name, 'FollowUp');

        toast({
            title: "Follow-up Updated",
            description: `A new follow-up has been scheduled for ${buyer.name}.`
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
          {isFollowUpsLoading ? (
             <p className="text-muted-foreground col-span-full text-center py-10">Loading follow-ups...</p>
          ) : !followUpsData || followUpsData.length === 0 ? (
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
                    <p className="flex items-center gap-1.5"><strong>Next Reminder:</strong> {new Date(followUp.nextReminderDate).toLocaleDateString()} <Clock className="h-4 w-4 inline-block" /> {followUp.nextReminderTime}</p>
                  </div>
                  <p className="text-sm border-t pt-3">{followUp.notes}</p>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" size="icon" onClick={(e) => handlePhoneClick(e, followUp.buyerPhone)}><Phone /></Button>
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
          activeAgents={[]}
          onAssign={() => {}}
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
