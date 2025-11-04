
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { appointments } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Calendar, Check, Clock, PlusCircle, User } from 'lucide-react';

export default function AppointmentsPage() {
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
        <Button className="glowing-btn">
          <PlusCircle />
          Add Appointment
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {appointments.map((appt) => (
          <Card key={appt.id} className="hover:shadow-primary/10 transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold font-headline">
                {appt.buyerName}
              </CardTitle>
              <Badge variant={appt.status === 'Completed' ? 'default' : 'secondary'} className="capitalize">
                 {appt.status === 'Completed' && <Check className="mr-1 h-3 w-3" />}
                {appt.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{appt.propertyAddress}</p>
              <div className="flex items-center text-sm">
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
    </div>
  );
}
