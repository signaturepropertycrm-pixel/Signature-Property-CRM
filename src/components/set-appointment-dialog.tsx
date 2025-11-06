
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AppointmentContactType } from '@/lib/types';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Textarea } from './ui/textarea';

interface SetAppointmentDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  appointmentDetails: {
    contactType: AppointmentContactType;
    contactName: string;
    message: string;
  };
}

const formSchema = z.object({
  contactType: z.enum(['Buyer', 'Owner']),
  contactName: z.string().min(1, 'Contact name is required'),
  message: z.string().min(1, 'Message is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
});

type AppointmentFormValues = z.infer<typeof formSchema>;

export function SetAppointmentDialog({
  isOpen,
  setIsOpen,
  appointmentDetails,
}: SetAppointmentDialogProps) {
  const { toast } = useToast();
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contactType: appointmentDetails.contactType,
      contactName: appointmentDetails.contactName,
      message: appointmentDetails.message,
      date: '',
      time: '',
    },
  });

  const { reset } = form;

  useEffect(() => {
    if (isOpen) {
      reset({
        contactType: appointmentDetails.contactType,
        contactName: appointmentDetails.contactName,
        message: appointmentDetails.message,
        date: '',
        time: '',
      });
    }
  }, [isOpen, appointmentDetails, reset]);

  const onSubmit = (data: AppointmentFormValues) => {
    // Here you would typically save the appointment to your state or backend.
    console.log('New Appointment:', data);
    toast({
      title: 'Appointment Set!',
      description: `Appointment with ${data.contactName} has been scheduled.`,
    });
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Set New Appointment</DialogTitle>
          <DialogDescription>
            Fill in the details to schedule a new appointment.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <FormField
                    control={form.control}
                    name="contactType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contact Type</FormLabel>
                             <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Buyer">Buyer</SelectItem>
                                    <SelectItem value="Owner">Property Owner</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="e.g. Ahmed Hassan" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                                <Textarea {...field} placeholder="e.g. Meeting at property location..." />
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
                    <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button type="submit">Save Appointment</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
