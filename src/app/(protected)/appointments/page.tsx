

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Check, Clock, PlusCircle, User, Briefcase, Building, MessageSquare, MoreHorizontal, Edit, Trash2, XCircle, Users } from 'lucide-react';
import { SetAppointmentDialog } from '@/components/set-appointment-dialog';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { Appointment, AppointmentStatus, Activity } from '@/lib/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UpdateAppointmentStatusDialog } from '@/components/update-appointment-status-dialog';
import { useSearchParams } from 'next/navigation';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, addDoc, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useMemoFirebase } from '@/firebase/hooks';
import { useProfile } from '@/context/profile-context';


function AppointmentsPageContent() {
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get('type') as 'Buyer' | 'Owner' | null;

  const firestore = useFirestore();
  const { profile } = useProfile();
  const { toast } = useToast();

  const appointmentsQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'appointments') : null, [profile.agency_id, firestore]);
  const { data: appointmentsData, isLoading } = useCollection<Appointment>(appointmentsQuery);

  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
  const [appointmentToUpdateStatus, setAppointmentToUpdateStatus] = useState<Appointment | null>(null);
  const [newStatus, setNewStatus] = useState<AppointmentStatus | null>(null);

  const logActivity = async (action: string, target: string, details: any = null) => {
    if (!profile.agency_id) return;
    const activityLogRef = collection(firestore, 'agencies', profile.agency_id, 'activityLogs');
    const newActivity: Omit<Activity, 'id'> = {
      userName: profile.name,
      action,
      target,
      targetType: 'Appointment',
      details,
      timestamp: new Date().toISOString(),
      agency_id: profile.agency_id,
    };
    await addDoc(activityLogRef, newActivity);
  };

  const handleSaveAppointment = async (appointment: Appointment) => {
    if (!profile.agency_id) return;
    
    if (appointmentToEdit) {
        // It's an update (reschedule)
        const docRef = doc(collection(firestore, 'agencies', profile.agency_id, 'appointments'), appointment.id);
        await setDoc(docRef, appointment, { merge: true });
        toast({ title: 'Appointment Rescheduled', description: `Appointment with ${appointment.contactName} has been updated.` });
        await logActivity('rescheduled appointment', appointment.contactName);
    } else {
        // It's a new appointment
        const { id, ...newAppointmentData } = appointment;
        const collectionRef = collection(firestore, 'agencies', profile.agency_id, 'appointments');
        await addDoc(collectionRef, newAppointmentData);
        toast({ title: 'Appointment Set', description: `Appointment with ${appointment.contactName} has been scheduled.` });
        await logActivity('set a new appointment', appointment.contactName);
    }
    setAppointmentToEdit(null);
  };

  const handleDeleteAppointment = async (appointment: Appointment) => {
    if (!profile.agency_id) return;
    await deleteDoc(doc(firestore, 'agencies', profile.agency_id, 'appointments', appointment.id));
    toast({ title: 'Appointment Deleted', variant: 'destructive' });
    await logActivity('deleted an appointment', appointment.contactName);
  };
  
  const handleReschedule = (appointment: Appointment) => {
    setAppointmentToEdit(appointment);
    setIsAppointmentOpen(true);
  };
  
  const handleOpenStatusUpdate = (appointment: Appointment, status: 'Completed' | 'Cancelled') => {
      setAppointmentToUpdateStatus(appointment);
      setNewStatus(status);
  };

  const handleUpdateStatus = async (appointmentId: string, status: AppointmentStatus, notes?: string) => {
      if (!profile.agency_id) return;
      const appointment = appointmentsData?.find(a => a.id === appointmentId);
      if (!appointment) return;

      const docRef = doc(firestore, 'agencies', profile.agency_id, 'appointments', appointmentId);
      await setDoc(docRef, { status, notes: notes || '' }, { merge: true });
      toast({ title: 'Appointment Updated', description: `Status has been changed to ${status}.` });
      await logActivity('updated appointment status', appointment.contactName, { from: appointment.status, to: status });
  };

  const statusConfig: { [key in AppointmentStatus]: { variant: 'default' | 'secondary' | 'destructive', icon?: React.ComponentType<{ className?: string }> } } = {
    Scheduled: { variant: 'secondary', icon: Clock },
    Completed: { variant: 'default', icon: Check },
    Cancelled: { variant: 'destructive', icon: XCircle },
  };

  const filteredAppointments = useMemo(() => {
    if (!appointmentsData) return [];
    if (typeFilter) {
      return appointmentsData.filter(a => a.contactType === typeFilter);
    }
    return appointmentsData;
  }, [appointmentsData, typeFilter]);

  const buyerAppointments = useMemo(() => filteredAppointments.filter(a => a.contactType === 'Buyer'), [filteredAppointments]);
  const ownerAppointments = useMemo(() => filteredAppointments.filter(a => a.contactType === 'Owner'), [filteredAppointments]);

  const renderAppointmentCard = (appt: Appointment) => {
    const currentStatus = statusConfig[appt.status];
    return(
        <Card key={appt.id} className="hover:shadow-primary/10 transition-shadow flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center rounded-full h-10 w-10 ${appt.contactType === 'Buyer' ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300' : 'bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300'}`}>
                        {appt.contactType === 'Buyer' ? <Briefcase className="h-5 w-5" /> : <Building className="h-5 w-5" />}
                    </div>
                    <CardTitle className="text-base font-semibold font-headline">
                        {appt.contactName}
                    </CardTitle>
                </div>
            <Badge 
                variant={currentStatus.variant} 
                className={`capitalize ${appt.status === 'Completed' ? 'bg-green-600' : ''}`}
            >
                {currentStatus.icon && <currentStatus.icon className="mr-1 h-3 w-3" />}
                {appt.status}
            </Badge>
            </CardHeader>
            <CardContent className="space-y-3 flex-1">
            <div className="flex items-start text-sm min-h-[40px]">
                <MessageSquare className="mr-2 mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{appt.notes ? `[${appt.status}]: ${appt.notes}` : appt.message}</p>
            </div>
            <div className="flex items-center text-sm pt-3 border-t">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{new Date(appt.date).toLocaleDateString()}</span>
                <Clock className="ml-4 mr-2 h-4 w-4 text-muted-foreground" />
                <span>{appt.time}</span>
            </div>
            <div className="flex items-center text-sm pt-2 border-t border-dashed">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Agent:</span>
                <span className="ml-2 font-medium">{appt.agentName}</span>
            </div>
            </CardContent>
             <CardFooter className="flex justify-end border-t pt-4">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="sm" variant="ghost">
                        Actions
                        <MoreHorizontal className="ml-2 h-4 w-4" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-card">
                        <DropdownMenuItem onSelect={() => handleOpenStatusUpdate(appt, 'Completed')}>
                            <Check />
                            Mark as Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleOpenStatusUpdate(appt, 'Cancelled')}>
                            <XCircle />
                            Mark as Cancelled
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleReschedule(appt)}>
                            <Edit />
                            Reschedule
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleDeleteAppointment(appt)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                            <Trash2 />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
    );
  }

  const renderSection = (title: string, icon: React.ReactNode, appointments: Appointment[]) => (
     <div>
        <h2 className="text-2xl font-bold tracking-tight font-headline mb-4 flex items-center gap-2">{icon} {title}</h2>
        {isLoading ? <p className="text-muted-foreground">Loading...</p> : appointments.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {appointments.map(renderAppointmentCard)}
            </div>
        ) : (
            <Card className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No {title.toLowerCase()} scheduled.</p>
            </Card>
        )}
    </div>
  );


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Appointments
          </h1>
          <p className="text-muted-foreground">
            {typeFilter ? `Showing ${typeFilter} appointments.` : 'Manage your upcoming appointments.'}
          </p>
        </div>
        <Button className="glowing-btn" onClick={() => { setAppointmentToEdit(null); setIsAppointmentOpen(true); }}>
            <PlusCircle />
            Add Appointment
        </Button>
      </div>

        <div className="space-y-8">
            {(!typeFilter || typeFilter === 'Buyer') && renderSection('Buyer Appointments', <Users className="text-primary"/>, buyerAppointments)}
            {(!typeFilter || typeFilter === 'Owner') && renderSection('Owner Appointments', <Building className="text-primary"/>, ownerAppointments)}
        </div>

       <SetAppointmentDialog 
            isOpen={isAppointmentOpen}
            setIsOpen={setIsAppointmentOpen}
            onSave={handleSaveAppointment}
            appointmentToEdit={appointmentToEdit}
        />
        {appointmentToUpdateStatus && newStatus && (
            <UpdateAppointmentStatusDialog
                isOpen={!!appointmentToUpdateStatus}
                setIsOpen={() => setAppointmentToUpdateStatus(null)}
                appointment={appointmentToUpdateStatus}
                newStatus={newStatus}
                onUpdate={handleUpdateStatus}
            />
        )}
    </div>
  );
}


export default function AppointmentsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AppointmentsPageContent />
        </Suspense>
    );
}
