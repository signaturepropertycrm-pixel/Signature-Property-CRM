
'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, MessageSquare, CalendarPlus, CheckCircle, Clock, Trash2, Bookmark } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { FollowUp, Buyer, Appointment, AppointmentContactType, Activity, BuyerStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { BuyerDetailsDialog } from '@/components/buyer-details-dialog';
import { SetAppointmentDialog } from '@/components/set-appointment-dialog';
import { AddFollowUpDialog } from '@/components/add-follow-up-dialog';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, addDoc, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/hooks';
import { useProfile } from '@/context/profile-context';
import { formatPhoneNumber } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { buyerStatuses } from '@/lib/data';


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

  const currentFollowUp = useMemo(() => {
    if (!buyerForFollowUp || !followUpsData) return null;
    return followUpsData.find(fu => fu.buyerId === buyerForFollowUp.id);
  }, [buyerForFollowUp, followUpsData]);
  
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
  
  const handleOpenReschedule = (e: React.MouseEvent, followUp: FollowUp) => {
      e.stopPropagation();
      const buyer = buyersData?.find(b => b.id === followUp.buyerId);
      if (buyer) {
          setBuyerForFollowUp(buyer);
          setIsFollowUpOpen(true);
      }
  };

  const handleSaveFollowUp = async (buyerId: string, notes: string, nextReminderDate: string, nextReminderTime: string, existingFollowUp?: FollowUp | null) => {
        if (!profile.agency_id || !buyersData) return;
        const buyer = buyersData.find(b => b.id === buyerId);
        if (!buyer) return;

        const newFollowUpData: Partial<FollowUp> = {
            buyerId: buyer.id,
            buyerName: buyer.name,
            buyerPhone: buyer.phone,
            propertyInterest: buyer.area_preference || 'General',
            nextReminderDate: nextReminderDate,
            nextReminderTime: nextReminderTime,
            status: 'Scheduled',
            notes: notes,
            agency_id: profile.agency_id
        };
        
        const followUpsCollection = collection(firestore, 'agencies', profile.agency_id, 'followUps');
        const buyerDocRef = doc(firestore, 'agencies', profile.agency_id, 'buyers', buyerId);

        let action = 'scheduled a follow-up';
        if (existingFollowUp) {
            newFollowUpData.lastContactDate = existingFollowUp.nextReminderDate;
            newFollowUpData.lastContactTime = existingFollowUp.nextReminderTime;
            await setDoc(doc(followUpsCollection, existingFollowUp.id), newFollowUpData, { merge: true });
            action = 'rescheduled a follow-up';
        } else {
            newFollowUpData.lastContactDate = new Date().toISOString().split('T')[0];
            newFollowUpData.lastContactTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            await addDoc(followUpsCollection, newFollowUpData);
        }
        
        await logActivity(action, buyer.name, 'FollowUp');
        
        toast({
            title: "Follow-up Updated",
            description: `A new follow-up has been scheduled for ${buyer.name}.`
        });

        setIsFollowUpOpen(false);
        setBuyerForFollowUp(null);
  };
  
    const handleChangeStatus = async (followUp: FollowUp, newStatus: BuyerStatus) => {
        if (!profile.agency_id) return;
        const buyer = buyersData?.find(b => b.id === followUp.buyerId);
        if (!buyer) return;
        
        try {
            const batch = writeBatch(firestore);

            const followUpRef = doc(firestore, 'agencies', profile.agency_id, 'followUps', followUp.id);
            batch.delete(followUpRef);

            const buyerRef = doc(firestore, 'agencies', profile.agency_id, 'buyers', followUp.buyerId);
            batch.update(buyerRef, { status: newStatus });
            
            await batch.commit();

            await logActivity('updated buyer status from follow-up', followUp.buyerName, 'Buyer', { from: 'Follow Up', to: newStatus });
            toast({ title: 'Status Updated', description: `${buyer.name}'s status has been changed to "${newStatus}".` });
        } catch (error) {
            toast({ title: 'Error', description: 'Could not update status.', variant: 'destructive' });
            console.error("Error updating status from follow-up: ", error);
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
                      {followUp.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Last Contact:</strong> {new Date(followUp.lastContactDate).toLocaleDateString()} {followUp.lastContactTime && `- ${followUp.lastContactTime}`}</p>
                    <p className="flex items-center gap-1.5"><strong>Next Reminder:</strong> {new Date(followUp.nextReminderDate).toLocaleDateString()} <Clock className="h-4 w-4 inline-block" /> {followUp.nextReminderTime}</p>
                  </div>
                  <p className="text-sm border-t pt-3">{followUp.notes}</p>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" onClick={(e) => e.stopPropagation()}>
                            <Bookmark />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                        {buyerStatuses
                            .filter(status => status !== 'Follow Up')
                            .map(status => (
                                <DropdownMenuItem key={status} onSelect={() => handleChangeStatus(followUp, status)}>
                                    {status}
                                </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="icon" onClick={(e) => handleWhatsAppClick(e, followUp.buyerPhone)}><MessageSquare /></Button>
                  <Button variant="outline" size="icon" onClick={(e) => handleOpenReschedule(e, followUp)}><CalendarPlus /></Button>
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
              existingFollowUp={currentFollowUp}
              onSave={handleSaveFollowUp}
          />
      )}
    </>
  );
}
