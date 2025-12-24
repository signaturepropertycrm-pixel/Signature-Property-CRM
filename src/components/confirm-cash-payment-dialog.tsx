
'use client';

import { useState } from 'react';
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
import { Property } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ConfirmCashPaymentDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  property: Property;
  onConfirm: (property: Property, amount: number) => Promise<void>;
}

const formSchema = z.object({
  amount: z.coerce.number().positive('Payment amount must be a positive number.'),
});

type PaymentFormValues = z.infer<typeof formSchema>;

export function ConfirmCashPaymentDialog({
  isOpen,
  setIsOpen,
  property,
  onConfirm,
}: ConfirmCashPaymentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: property.recording_payment_amount || 0,
    },
  });

  const onSubmit = async (data: PaymentFormValues) => {
    setIsLoading(true);
    await onConfirm(property, data.amount);
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Confirm Cash Payment</DialogTitle>
          <DialogDescription>
            Enter the amount of cash received from the owner for property {property.serial_no}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Received (PKR)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} placeholder="e.g. 500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm & Save Payment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
