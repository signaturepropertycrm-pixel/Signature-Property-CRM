
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
import { Property, PriceUnit } from '@/lib/types';
import { formatUnit } from '@/lib/formatters';

const formSchema = z.object({
  soldPrice: z.coerce.number().positive("Sold price is required"),
  soldPriceUnit: z.enum(['Lacs', 'Crore']),
});

type MarkAsSoldFormValues = z.infer<typeof formSchema>;

interface MarkAsSoldDialogProps {
  property: Property;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onUpdateProperty: (updatedProperty: Property) => void;
}

export function MarkAsSoldDialog({
  property,
  isOpen,
  setIsOpen,
  onUpdateProperty,
}: MarkAsSoldDialogProps) {
  const { toast } = useToast();
  const form = useForm<MarkAsSoldFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      soldPrice: property.demand_amount,
      soldPriceUnit: property.demand_unit,
    },
  });

  function onSubmit(values: MarkAsSoldFormValues) {
    const soldPriceInPkr = formatUnit(values.soldPrice, values.soldPriceUnit);
    
    const updatedProperty: Property = {
        ...property,
        status: 'Sold',
        sold_at: new Date().toISOString(),
        sold_price: soldPriceInPkr,
    };
    onUpdateProperty(updatedProperty);
    
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
            Enter the final sale price for {property.auto_title}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="soldPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Final Sold Price</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="soldPriceUnit"
                  render={({ field }) => (
                    <FormItem className="self-end">
                      <FormLabel className="sr-only">Unit</FormLabel>
                       <FormControl>
                          <Input type="text" value={field.value} readOnly className="mt-8 bg-muted/50" />
                       </FormControl>
                       <FormMessage />
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
              <Button type="submit">Save & Mark as Sold</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
