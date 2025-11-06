
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { appointments } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Calendar, Check, Clock, PlusCircle, User, Briefcase, Building, MessageSquare } from 'lucide-react';
import { SetAppointmentDialog } from '@/components/set-appointment-dialog';
import { useState } from 'react';
import { Appointment } from '@/lib/types';


export default function AppointmentsPage() {
  const [appointmentsData, setAppointmentsData] = useState<Appointment[]>(appointments);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);

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
        <Button className="glowing-btn" onClick={() => setIsAppointmentOpen(true)}>
            <PlusCircle />
            Add Appointment
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {appointmentsData.map((appt) => (
          <Card key={appt.id} className="hover:shadow-primary/10 transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center rounded-full h-10 w-10 ${appt.contactType === 'Buyer' ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300' : 'bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300'}`}>
                        {appt.contactType === 'Buyer' ? <Briefcase className="h-5 w-5" /> : <Building className="h-5 w-5" />}
                    </div>
                    <CardTitle className="text-base font-semibold font-headline">
                        {appt.contactName}
                    </CardTitle>
                </div>
              <Badge variant={appt.status === 'Completed' ? 'default' : 'secondary'} className="capitalize">
                 {appt.status === 'Completed' && <Check className="mr-1 h-3 w-3" />}
                {appt.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start text-sm">
                <MessageSquare className="mr-2 mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{appt.message}</p>
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
          </Card>
        ))}
      </div>
       <SetAppointmentDialog 
            isOpen={isAppointmentOpen}
            setIsOpen={setIsAppointmentOpen}
        />
    </div>
  );
}
