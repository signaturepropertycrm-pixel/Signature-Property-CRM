
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
import { Property } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface CannotRecordDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  property: Property;
  onSave: (property: Property, reason: string) => void;
}

const formSchema = z.object({
  reason: z.string().min(10, "Please provide a detailed reason."),
});

type ReasonFormValues = z.infer<typeof formSchema>;

export function CannotRecordDialog({
  isOpen,
  setIsOpen,
  property,
  onSave,
}: CannotRecordDialogProps) {
  const { toast } = useToast();
  const form = useForm<ReasonFormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: ReasonFormValues) => {
    onSave(property, data.reason);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Cannot Record Video</DialogTitle>
          <DialogDescription>
            Provide a reason why you cannot record the video for {property.serial_no}. This will be sent to the admin.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder={`e.g., Owner not available, property is locked...`} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit Reason</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
