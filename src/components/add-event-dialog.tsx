
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Textarea } from './ui/textarea';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

export interface EventDetails {
    title: string;
    date: string;
    time: string;
    description: string;
}

interface AddEventDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSave: (event: EventDetails) => void;
}

const formSchema = z.object({
  title: z.string().min(1, 'Event title is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  description: z.string().optional(),
});

type EventFormValues = z.infer<typeof formSchema>;

type View = 'form' | 'confirm';

export function AddEventDialog({
  isOpen,
  setIsOpen,
  onSave,
}: AddEventDialogProps) {
  const [view, setView] = useState<View>('form');

  const form = useForm<EventFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '12:00',
        description: ''
    }
  });
  
  useEffect(() => {
    if (isOpen) {
        setView('form');
        form.reset({
            title: '',
            date: new Date().toISOString().split('T')[0],
            time: '12:00',
            description: ''
        });
    }
  }, [isOpen, form]);

  const onSubmit = (data: EventFormValues) => {
    // Open Google Calendar link and switch view to confirmation
    const startTime = new Date(`${data.date}T${data.time}:00`);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Default to 1 hour
    const formatDate = (date: Date) => format(date, "yyyyMMdd'T'HHmmss");
    
    const url = new URL('https://www.google.com/calendar/render');
    url.searchParams.set('action', 'TEMPLATE');
    url.searchParams.set('text', data.title);
    url.searchParams.set('dates', `${formatDate(startTime)}/${formatDate(endTime)}`);
    url.searchParams.set('details', data.description || '');
    
    window.open(url.toString(), '_blank');
    setView('confirm');
  };

  const handleConfirmation = (saved: boolean) => {
    if (saved) {
        onSave(form.getValues());
    }
    setIsOpen(false);
  }

  const renderForm = () => (
     <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Event Title</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="e.g., Team Meeting" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                            <Textarea {...field} placeholder="e.g., Discuss quarterly targets..." />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                                <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Time</FormLabel>
                            <FormControl>
                                <Input {...field} type="time" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <DialogFooter className="pt-4">
            <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                >
                Cancel
                </Button>
                <Button
                type="submit"
                >
                Create Event in Google Calendar
                </Button>
            </DialogFooter>
        </form>
    </Form>
  );

  const renderConfirmation = () => (
      <div className="space-y-4 text-center">
        <p>Did you save the event to your Google Calendar?</p>
        <p className="text-sm text-muted-foreground">Confirming will also add this event to your CRM calendar.</p>
        <div className="flex justify-center gap-4 pt-4">
            <Button variant="outline" onClick={() => handleConfirmation(false)}>No, Cancel</Button>
            <Button onClick={() => handleConfirmation(true)}>Yes, Add to CRM</Button>
        </div>
      </div>
  );
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">{view === 'form' ? 'Add New Event' : 'Confirm Event'}</DialogTitle>
          <DialogDescription>
            {view === 'form' ? 'Create a generic event and add it to your Google Calendar.' : 'Please confirm if you saved the event.'}
          </DialogDescription>
        </DialogHeader>
        {view === 'form' ? renderForm() : renderConfirmation()}
      </DialogContent>
    </Dialog>
  );
}
