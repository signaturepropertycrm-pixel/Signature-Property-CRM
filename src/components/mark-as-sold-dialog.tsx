
'use client';
import { useState, useEffect } from 'react';
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
import { Property, PriceUnit, User } from '@/lib/types';
import { formatUnit } from '@/lib/formatters';
import { useProfile } from '@/context/profile-context';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { useMemoFirebase } from '@/firebase/hooks';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const formSchema = z.object({
  soldPrice: z.coerce.number().positive("Sold price is required"),
  soldPriceUnit: z.enum(['Lacs', 'Crore']),
  soldByAgentId: z.string().min(1, "You must select the agent who sold the property."),
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
  const { profile } = useProfile();
  const firestore = useFirestore();

  const teamMembersQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'teamMembers') : null, [profile.agency_id, firestore]);
  const { data: teamMembers } = useCollection<User>(teamMembersQuery);

  const activeAgents = teamMembers?.filter(m => m.status === 'Active') || [];

  const form = useForm<MarkAsSoldFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      soldPrice: property.demand_amount,
      soldPriceUnit: property.demand_unit,
      soldByAgentId: '',
    },
  });
  
  useEffect(() => {
    if (isOpen) {
        form.reset({
            soldPrice: property.demand_amount,
            soldPriceUnit: property.demand_unit,
            soldByAgentId: '',
        });
    }
  }, [isOpen, property, form]);

  function onSubmit(values: MarkAsSoldFormValues) {
    const soldPriceInPkr = formatUnit(values.soldPrice, values.soldPriceUnit);
    
    const updatedProperty: Property = {
        ...property,
        status: 'Sold',
        sold_at: new Date().toISOString(),
        sold_price: soldPriceInPkr, // Save the final numeric value
        soldByAgentId: values.soldByAgentId,
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
                          <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="mt-8">
                                    <SelectValue />
                                </SelectTrigger>
                               <SelectContent>
                                    <SelectItem value="Lacs">Lacs</SelectItem>
                                    <SelectItem value="Crore">Crore</SelectItem>
                               </SelectContent>
                           </Select>
                       </FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               <FormField
                control={form.control}
                name="soldByAgentId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Sold by Agent</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an agent..." />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {activeAgents.map(agent => (
                                    <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
               />

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

    