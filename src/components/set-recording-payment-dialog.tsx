
'use client';

import { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Property, RecordingPaymentStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Circle, CheckCircle, Clock } from 'lucide-react';

interface SetRecordingPaymentDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  property: Property;
  agentId: string;
  agentName: string;
  onConfirm: (property: Property, agentId: string, paymentDetails: any) => Promise<void>;
}

const formSchema = z.object({
  status: z.enum(['Unpaid', 'Paid Online', 'Pending Cash']).default('Unpaid'),
  amount: z.coerce.number().min(0).optional(),
});

type PaymentFormValues = z.infer<typeof formSchema>;

export function SetRecordingPaymentDialog({
  isOpen,
  setIsOpen,
  property,
  agentId,
  agentName,
  onConfirm,
}: SetRecordingPaymentDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'Unpaid',
      amount: 0,
    },
  });

  const watchedStatus = useWatch({ control: form.control, name: 'status' });

  const onSubmit = async (data: PaymentFormValues) => {
    setIsLoading(true);
    const paymentDetails = {
        recording_payment_status: data.status as RecordingPaymentStatus,
        recording_payment_amount: data.status === 'Paid Online' ? data.amount : 0,
        recording_payment_date: data.status !== 'Unpaid' ? new Date().toISOString() : null,
    };
    try {
        await onConfirm(property, agentId, paymentDetails);
        setIsOpen(false);
    } catch (error) {
        console.error("Failed to assign and set payment:", error);
        toast({ title: 'Error', description: 'Could not complete the action.', variant: 'destructive'});
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Assign & Set Payment</DialogTitle>
          <DialogDescription>
            Assigning {property.serial_no} to {agentName}. Set the payment status for this video recording.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Unpaid"><div className="flex items-center gap-2"><Circle className="h-4 w-4 text-orange-500" /> Unpaid</div></SelectItem>
                      <SelectItem value="Paid Online"><div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Paid Online</div></SelectItem>
                      <SelectItem value="Pending Cash"><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-purple-500" /> Pending Cash</div></SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {watchedStatus === 'Paid Online' && (
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Amount (PKR)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} placeholder="e.g. 500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm & Assign
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
