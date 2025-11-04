'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Property } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const formSchema = z.object({
  agentName: z.string().min(1, 'Agent name is required'),
  buyerCommissionAmount: z.coerce.number().optional(),
  buyerCommissionUnit: z.enum(['Thousand', 'Lacs', 'Crore']).optional(),
  sellerCommissionAmount: z.coerce.number().optional(),
  sellerCommissionUnit: z.enum(['Thousand', 'Lacs', 'Crore']).optional(),
  buyerSrNo: z.string().optional(),
});

type MarkAsSoldFormValues = z.infer<typeof formSchema>;

interface MarkAsSoldDialogProps {
  property: Property;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function MarkAsSoldDialog({
  property,
  isOpen,
  setIsOpen,
}: MarkAsSoldDialogProps) {
  const { toast } = useToast();
  const form = useForm<MarkAsSoldFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      buyerCommissionUnit: 'Thousand',
      sellerCommissionUnit: 'Thousand',
    },
  });

  function onSubmit(values: MarkAsSoldFormValues) {
    console.log({ ...values, soldDate: new Date() });
    toast({
      title: 'Property Marked as Sold',
      description: `${property.auto_title} has been updated.`,
    });
    setIsOpen(false);
    form.reset();
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Mark as Sold</DialogTitle>
          <DialogDescription>
            Enter the sale details for {property.auto_title}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="agentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agent Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Agent who sold the property" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Sold Date</FormLabel>
                <Input value={new Date().toLocaleDateString()} readOnly />
              </FormItem>
              <FormField
                control={form.control}
                name="buyerSrNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buyer Sr No.</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., B-823" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="buyerCommissionAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission (from Buyer)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} placeholder="50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="buyerCommissionUnit"
                render={({ field }) => (
                  <FormItem className="self-end">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Thousand">Thousand</SelectItem>
                        <SelectItem value="Lacs">Lacs</SelectItem>
                        <SelectItem value="Crore">Crore</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="sellerCommissionAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission (from Seller)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} placeholder="50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sellerCommissionUnit"
                render={({ field }) => (
                  <FormItem className="self-end">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Thousand">Thousand</SelectItem>
                        <SelectItem value="Lacs">Lacs</SelectItem>
                        <SelectItem value="Crore">Crore</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
