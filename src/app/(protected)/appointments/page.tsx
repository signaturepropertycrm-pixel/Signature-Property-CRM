
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { appointments } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Calendar, Check, Clock, PlusCircle, User, Briefcase, Building, MessageSquare, MoreHorizontal, Edit, Trash2, XCircle } from 'lucide-react';
import { SetAppointmentDialog } from '@/components/set-appointment-dialog';
import { useState } from 'react';
import { Appointment, AppointmentStatus } from '@/lib/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UpdateAppointmentStatusDialog } from '@/components/update-appointment-status-dialog';


export default function AppointmentsPage() {
  const [appointmentsData, setAppointmentsData] = useState<Appointment[]>(appointments);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
  const [appointmentToUpdateStatus, setAppointmentToUpdateStatus] = useState<Appointment | null>(null);
  const [newStatus, setNewStatus] = useState<AppointmentStatus | null>(null);


  const handleSaveAppointment = (appointment: Appointment) => {
    if (appointmentToEdit) {
      // It's an update (reschedule)
      setAppointmentsData(prev => prev.map(a => a.id === appointment.id ? appointment : a));
      setAppointmentToEdit(null);
    } else {
      // It's a new appointment
      setAppointmentsData(prev => [appointment, ...prev]);
    }
  };

  const handleDeleteAppointment = (id: string) => {
    setAppointmentsData(prev => prev.filter(a => a.id !== id));
  };
  
  const handleReschedule = (appointment: Appointment) => {
    setAppointmentToEdit(appointment);
    setIsAppointmentOpen(true);
  };
  
  const handleOpenStatusUpdate = (appointment: Appointment, status: 'Completed' | 'Cancelled') => {
      setAppointmentToUpdateStatus(appointment);
      setNewStatus(status);
  };

  const handleUpdateStatus = (appointmentId: string, status: AppointmentStatus, notes?: string) => {
      setAppointmentsData(prev => prev.map(a => 
          a.id === appointmentId 
              ? { ...a, status, notes: notes || a.notes } 
              : a
      ));
  };

  const statusConfig: { [key in AppointmentStatus]: { variant: 'default' | 'secondary' | 'destructive', icon?: React.ComponentType<{ className?: string }> } } = {
    Scheduled: { variant: 'secondary', icon: Clock },
    Completed: { variant: 'default', icon: Check },
    Cancelled: { variant: 'destructive', icon: XCircle },
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Appointments
          </h1>
          <p className="text-muted-foreground">
            Manage your upcoming appointments.
          </p>
        </div>
        <Button className="glowing-btn" onClick={() => { setAppointmentToEdit(null); setIsAppointmentOpen(true); }}>
            <PlusCircle />
            Add Appointment
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {appointmentsData.map((appt) => {
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
                                <DropdownMenuItem onSelect={() => handleDeleteAppointment(appt.id)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                                    <Trash2 />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardFooter>
                </Card>
            )
        })}
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
