
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
import { Textarea } from './ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Buyer, BuyerStatus } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Input } from './ui/input';
import { buyerStatuses } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '@/hooks/use-toast';

interface AddFollowUpDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  buyer: Buyer;
  onSave: (buyerId: string, notes: string, nextReminder: string) => void;
  title?: string;
  description?: string;
  isStatusUpdateMode?: boolean;
}

const formSchema = z.object({
  notes: z.string().min(1, 'Follow-up notes are required.'),
  nextReminder: z.string().optional(),
  status: z.custom<BuyerStatus>().optional(),
});

type FollowUpFormValues = z.infer<typeof formSchema>;

const getDefaultDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toISOString().split('T')[0];
}

export function AddFollowUpDialog({
  isOpen,
  setIsOpen,
  buyer,
  onSave,
  title = "Schedule Follow-up",
  description,
  isStatusUpdateMode = false
}: AddFollowUpDialogProps) {
  const { toast } = useToast();
  const form = useForm<FollowUpFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        notes: buyer.last_follow_up_note || '',
        nextReminder: getDefaultDate(),
        status: buyer.status
    }
  });
  
  const watchedStatus = form.watch('status');

  useEffect(() => {
    if (buyer) {
        form.reset({ notes: buyer.last_follow_up_note || '', nextReminder: getDefaultDate(), status: buyer.status });
    }
  }, [buyer, form]);

  const onSubmit = (data: FollowUpFormValues) => {
    if (data.status === 'Follow Up') {
        onSave(buyer.id, data.notes, data.nextReminder || getDefaultDate());
    } else {
        // Just update the status if it's not 'Follow Up'
        const savedBuyers = JSON.parse(localStorage.getItem('buyers') || '[]');
        const updatedBuyers = savedBuyers.map((b: Buyer) => 
            b.id === buyer.id ? { ...b, status: data.status, last_follow_up_note: data.notes } : b
        );
        localStorage.setItem('buyers', JSON.stringify(updatedBuyers));
        
        // Remove from follow-ups if status changes from 'Follow Up'
        const savedFollowUps = JSON.parse(localStorage.getItem('followUps') || '[]');
        const updatedFollowUps = savedFollowUps.filter((fu: any) => fu.buyerId !== buyer.id);
        localStorage.setItem('followUps', JSON.stringify(updatedFollowUps));

        toast({
            title: "Buyer Status Updated",
            description: `${buyer.name}'s status has been changed to ${data.status}.`
        });

        // This is a bit of a hack to force a re-render on the follow-ups page
        window.dispatchEvent(new Event('storage'));
    }
    setIsOpen(false);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">{title}</DialogTitle>
          <DialogDescription>
            {description || `Add notes for following up with ${buyer.name}.`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             {isStatusUpdateMode && (
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Update Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {buyerStatuses.map(status => (
                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
            
            {(watchedStatus === 'Follow Up') && (
              <>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes / Reason for Follow-up</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder={`e.g., Client requested more property options in DHA...`} rows={5} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nextReminder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next Reminder Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {watchedStatus === 'Follow Up' ? 'Save Follow-up' : 'Update Status'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
