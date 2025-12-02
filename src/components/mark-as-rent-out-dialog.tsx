
'use client';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useForm, useWatch } from 'react-hook-form';
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
import { Property, User } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import { useProfile } from '@/context/profile-context';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, addDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { useMemoFirebase } from '@/firebase/hooks';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Calculator } from 'lucide-react';
import { useCurrency } from '@/context/currency-context';
import { Card, CardContent } from './ui/card';

const formSchema = z.object({
  rent_out_date: z.string().refine(date => new Date(date).toString() !== 'Invalid Date', { message: 'Please select a valid date' }),
  rented_by_agent_id: z.string().min(1, "You must select the agent."),
  rent_commission_from_tenant: z.coerce.number().min(0).optional(),
  rent_commission_from_owner: z.coerce.number().min(0).optional(),
  rent_agent_share: z.coerce.number().min(0).optional(),
});

type MarkAsRentOutFormValues = z.infer<typeof formSchema>;

interface MarkAsRentOutDialogProps {
  property: Property;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onUpdateProperty: (updatedProperty: Property) => void;
}

export function MarkAsRentOutDialog({
  property,
  isOpen,
  setIsOpen,
  onUpdateProperty,
}: MarkAsRentOutDialogProps) {
  const { toast } = useToast();
  const { profile } = useProfile();
  const { currency } = useCurrency();
  const firestore = useFirestore();

  const teamMembersQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'teamMembers') : null, [profile.agency_id, firestore]);
  const { data: teamMembers } = useCollection<User>(teamMembersQuery);

  const activeAgents = teamMembers?.filter(m => m.status === 'Active') || [];

  const form = useForm<MarkAsRentOutFormValues>({
    resolver: zodResolver(formSchema),
  });

  const watchFields = useWatch({ control: form.control });

  const totalCommission = useMemo(() => {
      const tenantCommission = watchFields.rent_commission_from_tenant || 0;
      const ownerCommission = watchFields.rent_commission_from_owner || 0;
      return tenantCommission + ownerCommission;
  }, [watchFields.rent_commission_from_tenant, watchFields.rent_commission_from_owner]);


  useEffect(() => {
    if (isOpen) {
        form.reset({
            rent_out_date: new Date().toISOString().split('T')[0],
            rented_by_agent_id: '',
            rent_commission_from_tenant: 0,
            rent_commission_from_owner: 0,
            rent_agent_share: 0,
        });
    }
  }, [isOpen, property, form]);

  async function onSubmit(values: MarkAsRentOutFormValues) {
    const updatedProperty: Property = {
        ...property,
        status: 'Rent Out',
        rent_out_date: values.rent_out_date,
        rented_by_agent_id: values.rented_by_agent_id,
        rent_commission_from_tenant: values.rent_commission_from_tenant,
        rent_commission_from_owner: values.rent_commission_from_owner,
        rent_total_commission: totalCommission,
        rent_agent_share: values.rent_agent_share,
    };
    onUpdateProperty(updatedProperty);
    
    if (profile.agency_id) {
        const activityLogRef = collection(firestore, 'agencies', profile.agency_id, 'activityLogs');
        const newActivity = {
            userName: profile.name,
            action: `marked property as "Rent Out"`,
            target: property.serial_no,
            targetType: 'Property',
            timestamp: new Date().toISOString(),
            agency_id: profile.agency_id,
        };
        await addDoc(activityLogRef, newActivity);
    }

    toast({
      title: 'Property Marked as Rent Out',
      description: `${property.auto_title} has been updated.`,
    });
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Mark Property as Rent Out</DialogTitle>
          <DialogDescription>
            Enter the final rental details for: {property.auto_title}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                <h4 className="text-sm font-medium text-muted-foreground">Rental Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="rent_out_date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Rent Out Date</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="rented_by_agent_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Rented by Agent</FormLabel>
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
                </div>
                
                <Separator />
                <h4 className="text-sm font-medium text-muted-foreground">Commission Details (PKR)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="rent_commission_from_tenant" render={({field}) => (
                        <FormItem>
                        <FormLabel>From Tenant</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g. 10000" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="rent_commission_from_owner" render={({field}) => (
                        <FormItem>
                        <FormLabel>From Owner</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g. 10000" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="rent_agent_share" render={({field}) => (
                        <FormItem>
                        <FormLabel>Agent's Share</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g. 5000" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                </div>
              </div>
            </ScrollArea>
            <div className="flex justify-between items-center gap-2 pt-6 border-t mt-6">
               <Card className="flex-1">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                            <Calculator className="text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Total Commission:</p>
                            <p className="font-bold text-lg">{formatCurrency(totalCommission, currency)}</p>
                        </div>
                    </CardContent>
               </Card>
               <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                </Button>
                <Button type="submit">Save & Mark as Rent Out</Button>
               </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
