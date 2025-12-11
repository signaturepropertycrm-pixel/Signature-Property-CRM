
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Appointment, AppointmentStatus } from "@/lib/types";
import { Calendar, Clock, Briefcase, Building, Plus, CalendarPlus, ChevronDown, MoreHorizontal, Edit, Trash2, CheckCircle, XCircle, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { isToday, isTomorrow, format, parseISO, addDays, subDays } from "date-fns";
import { useMemo } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import Link from "next/link";
import { Skeleton } from "./ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Separator } from "./ui/separator";

interface UpcomingEventsProps {
    appointments: Appointment[];
    isLoading: boolean;
    onAddAppointment: () => void;
    onAddEvent: () => void;
    onUpdateStatus: (appointment: Appointment, status: 'Completed' | 'Cancelled') => void;
    onDelete: (appointment: Appointment) => void;
    onAddToCalendar: (event: React.MouseEvent, appointment: Appointment) => void;
}

export function UpcomingEvents({ 
    appointments, 
    isLoading, 
    onAddAppointment, 
    onAddEvent,
    onUpdateStatus,
    onDelete,
    onAddToCalendar,
}: UpcomingEventsProps) {
    const [selectedDay, setSelectedDay] = useState<Date>(new Date());
    
    const eventsByDate = useMemo(() => {
        const map = new Map<string, Appointment[]>();
        if (appointments) {
            for (const appt of appointments) {
                if (appt.status !== 'Scheduled') continue;
                const dateKey = format(parseISO(appt.date), 'yyyy-MM-dd');
                if (!map.has(dateKey)) {
                    map.set(dateKey, []);
                }
                map.get(dateKey)!.push(appt);
                map.get(dateKey)!.sort((a,b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
            }
        }
        return map;
    }, [appointments]);

    const selectedDayEvents = eventsByDate.get(format(selectedDay, 'yyyy-MM-dd')) || [];
    const eventDays = Array.from(eventsByDate.keys()).map(dateStr => parseISO(dateStr));

    const handlePreviousDay = () => {
        setSelectedDay(prev => subDays(prev, 1));
    };

    const handleNextDay = () => {
        setSelectedDay(prev => addDays(prev, 1));
    };
    
    if (isLoading) {
        return (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1"><CardHeader><Skeleton className="h-6 w-48" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
                <Card className="lg:col-span-2"><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></CardContent></Card>
            </div>
        )
    }

    const getIcon = (appt: Appointment) => {
        if (appt.contactType === 'Buyer') return <Briefcase className="h-5 w-5" />;
        if (appt.contactType === 'Owner' && appt.contactSerialNo) return <Building className="h-5 w-5" />;
        return <Users className="h-5 w-5" />; // Generic event
    };

    const getIconBgColor = (appt: Appointment) => {
        if (appt.contactType === 'Buyer') return 'bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300';
        if (appt.contactType === 'Owner' && appt.contactSerialNo) return 'bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300';
        return 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300'; // Generic event
    }


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <Card className="bg-card/70 lg:col-span-1">
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline">
                        <Calendar />
                        Calendar
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                     <DayPicker
                        mode="single"
                        selected={selectedDay}
                        onSelect={(day) => day && setSelectedDay(day)}
                        modifiers={{ events: eventDays }}
                        modifiersClassNames={{
                            events: 'has-event'
                        }}
                        styles={{
                            day: {
                                position: 'relative'
                            },
                        }}
                        components={{
                            DayContent: (props) => {
                                const { date } = props;
                                const dateKey = format(date, 'yyyy-MM-dd');
                                const hasEvent = eventsByDate.has(dateKey);
                                return (
                                    <div className="relative">
                                        {props.children}
                                        {hasEvent && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-primary" />}
                                    </div>
                                );
                            },
                        }}
                    />
                </CardContent>
            </Card>

            <Card className="bg-card/70 lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={handlePreviousDay}><ChevronLeft /></Button>
                        <CardTitle className="font-headline">{format(selectedDay, "EEEE, MMMM d")}</CardTitle>
                        <Button variant="ghost" size="icon" onClick={handleNextDay}><ChevronRight /></Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button asChild variant="ghost" size="sm">
                            <Link href="/appointments">View All</Link>
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onSelect={onAddAppointment}>
                                    <Calendar />
                                    <span className="ml-2">Add Appointment</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={onAddEvent}>
                                    <CalendarPlus />
                                    <span className="ml-2">Add Event</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                 <CardContent>
                    <div className="space-y-3 h-80 overflow-y-auto pr-2 -mr-2">
                        {selectedDayEvents.length > 0 ? selectedDayEvents.map(appt => (
                            <div key={appt.id} className="flex items-start gap-4 p-3 rounded-lg bg-background hover:bg-accent/50 transition-colors group">
                                <div className={`flex items-center justify-center rounded-full h-10 w-10 flex-shrink-0 ${getIconBgColor(appt)}`}>
                                    {getIcon(appt)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">{appt.contactName}</p>
                                    <p className="text-xs text-muted-foreground">{appt.message}</p>
                                    <div className="text-xs text-muted-foreground mt-1">Agent: {appt.agentName}</div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="font-bold flex items-center gap-1.5"><Clock className="h-4 w-4" /> {appt.time}</div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onSelect={(e) => onAddToCalendar(e, appt)}>
                                                <CalendarPlus className="mr-2 h-4 w-4" /> Add to Calendar
                                            </DropdownMenuItem>
                                            <Separator />
                                             <DropdownMenuItem onSelect={() => onUpdateStatus(appt, 'Completed')}>
                                                <CheckCircle className="mr-2 h-4 w-4"/> Mark as Completed
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => onUpdateStatus(appt, 'Cancelled')}>
                                                <XCircle className="mr-2 h-4 w-4"/> Mark as Cancelled
                                            </DropdownMenuItem>
                                            <Separator />
                                            <DropdownMenuItem onSelect={() => onDelete(appt)} className="text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4"/> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        )) : (
                             <div className="flex items-center justify-center h-full">
                                <p className="text-sm text-muted-foreground text-center py-4">No events for this day.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
