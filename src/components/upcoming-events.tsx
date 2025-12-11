
'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Appointment } from "@/lib/types";
import { Calendar, Clock, Briefcase, Building } from "lucide-react";
import { isToday, isTomorrow, format } from "date-fns";
import { useMemo } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import Link from "next/link";
import { Skeleton } from "./ui/skeleton";

interface UpcomingEventsProps {
    appointments: Appointment[];
    isLoading: boolean;
}

export function UpcomingEvents({ appointments, isLoading }: UpcomingEventsProps) {

    const { today, tomorrow } = useMemo(() => {
        const today: Appointment[] = [];
        const tomorrow: Appointment[] = [];

        if (appointments) {
            for (const appt of appointments) {
                if (appt.status !== 'Scheduled') continue;

                const apptDate = new Date(`${appt.date}T${appt.time}`);
                if (isToday(apptDate)) {
                    today.push(appt);
                } else if (isTomorrow(apptDate)) {
                    tomorrow.push(appt);
                }
            }
        }
        
        today.sort((a,b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
        tomorrow.sort((a,b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

        return { today, tomorrow };
    }, [appointments]);
    
    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-4 w-24 mt-4" />
                    <Skeleton className="h-16 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-card/70">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 font-headline">
                    <Calendar />
                    Upcoming Events
                </CardTitle>
                <Button asChild variant="ghost" size="sm">
                    <Link href="/appointments">View All</Link>
                </Button>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h4 className="font-semibold mb-3">Today</h4>
                    {today.length > 0 ? (
                        <div className="space-y-3">
                            {today.map(appt => (
                                <div key={appt.id} className="flex items-center gap-4 p-3 rounded-lg bg-background">
                                    <div className={`flex items-center justify-center rounded-full h-10 w-10 flex-shrink-0 ${appt.contactType === 'Buyer' ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300' : 'bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300'}`}>
                                        {appt.contactType === 'Buyer' ? <Briefcase className="h-5 w-5" /> : <Building className="h-5 w-5" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold">{appt.contactName}</p>
                                        <p className="text-xs text-muted-foreground">{appt.message}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold flex items-center gap-1.5"><Clock className="h-4 w-4" /> {appt.time}</div>
                                        <Badge variant="secondary">{appt.agentName}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-muted-foreground text-center py-4">No appointments scheduled for today.</p>}
                </div>
                 <div>
                    <h4 className="font-semibold mb-3">Tomorrow</h4>
                    {tomorrow.length > 0 ? (
                        <div className="space-y-3">
                             {tomorrow.map(appt => (
                                <div key={appt.id} className="flex items-center gap-4 p-3 rounded-lg bg-background">
                                    <div className={`flex items-center justify-center rounded-full h-10 w-10 flex-shrink-0 ${appt.contactType === 'Buyer' ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300' : 'bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300'}`}>
                                        {appt.contactType === 'Buyer' ? <Briefcase className="h-5 w-5" /> : <Building className="h-5 w-5" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold">{appt.contactName}</p>
                                        <p className="text-xs text-muted-foreground">{appt.message}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold flex items-center gap-1.5"><Clock className="h-4 w-4" /> {appt.time}</div>
                                        <Badge variant="secondary">{appt.agentName}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-muted-foreground text-center py-4">No appointments scheduled for tomorrow.</p>}
                </div>
            </CardContent>
        </Card>
    );
}

