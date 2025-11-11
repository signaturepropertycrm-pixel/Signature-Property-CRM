
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
import { Buyer } from '@/lib/types';
import { useEffect } from 'react';
import { Input } from './ui/input';

interface AddFollowUpDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  buyer: Buyer;
  onSave: (buyerId: string, notes: string, nextReminder: string) => void;
}

const formSchema = z.object({
  notes: z.string().min(1, "Follow-up notes are required."),
  nextReminder: z.string().min(1, "Reminder date is required."),
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
}: AddFollowUpDialogProps) {
  const form = useForm<FollowUpFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        notes: '',
        nextReminder: getDefaultDate(),
    }
  });

  useEffect(() => {
    if (buyer) {
        form.reset({ 
            notes: buyer.last_follow_up_note || '', 
            nextReminder: getDefaultDate(),
        });
    }
  }, [buyer, form, isOpen]);

  const onSubmit = (data: FollowUpFormValues) => {
    onSave(buyer.id, data.notes, data.nextReminder);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Schedule Follow-up</DialogTitle>
          <DialogDescription>
            {`Add notes for following up with ${buyer.name}.`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Follow-up
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
