
'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Appointment } from "@/lib/types";
import { Calendar, Clock, Briefcase, Building, Plus, CalendarPlus, ChevronDown } from "lucide-react";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { isToday, isTomorrow, format, parseISO } from "date-fns";
import { useMemo } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import Link from "next/link";
import { Skeleton } from "./ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";

interface UpcomingEventsProps {
    appointments: Appointment[];
    isLoading: boolean;
    onAddAppointment: () => void;
    onAddEvent: () => void;
}

export function UpcomingEvents({ appointments, isLoading, onAddAppointment, onAddEvent }: UpcomingEventsProps) {
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
    
    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-64 w-full" />
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
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="border rounded-lg p-2 bg-background">
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
                </div>
                <div>
                    <h4 className="font-semibold mb-3">{format(selectedDay, "EEEE, MMMM d")}</h4>
                    <div className="space-y-3 h-64 overflow-y-auto pr-2">
                        {selectedDayEvents.length > 0 ? selectedDayEvents.map(appt => (
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
                        )) : (
                             <div className="flex items-center justify-center h-full">
                                <p className="text-sm text-muted-foreground text-center py-4">No events for this day.</p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
