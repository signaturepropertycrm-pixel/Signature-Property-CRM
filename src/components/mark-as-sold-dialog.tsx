
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
import { Property, PriceUnit, User, CommissionUnit } from '@/lib/types';
import { formatCurrency, formatUnit } from '@/lib/formatters';
import { useProfile } from '@/context/profile-context';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, addDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { useMemoFirebase } from '@/firebase/hooks';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Calculator } from 'lucide-react';
import { useCurrency } from '@/context/currency-context';
import { Card, CardContent } from './ui/card';

const formSchema = z.object({
  sold_price: z.coerce.number().positive("Sold price is required"),
  sold_price_unit: z.enum(['Lacs', 'Crore']),
  commission_from_buyer: z.coerce.number().min(0, "Commission cannot be negative").optional(),
  commission_from_buyer_unit: z.enum(['PKR', '%']).optional(),
  commission_from_seller: z.coerce.number().min(0, "Commission cannot be negative").optional(),
  commission_from_seller_unit: z.enum(['PKR', '%']).optional(),
  agent_share_percentage: z.coerce.number().min(0).max(100).optional(),
  sale_date: z.string().refine(date => new Date(date).toString() !== 'Invalid Date', { message: 'Please select a valid date' }),
  sold_by_agent_id: z.string().min(1, "You must select the agent who sold the property."),
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
  const { currency } = useCurrency();
  const firestore = useFirestore();

  const teamMembersQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'teamMembers') : null, [profile.agency_id, firestore]);
  const { data: teamMembers } = useCollection<User>(teamMembersQuery);

  const activeAgents = teamMembers?.filter(m => m.status === 'Active') || [];

  const form = useForm<MarkAsSoldFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sold_price: property.demand_amount,
      sold_price_unit: property.demand_unit,
      sale_date: new Date().toISOString().split('T')[0],
    },
  });

  const watchFields = useWatch({ control: form.control });

  const totalCommission = useMemo(() => {
      const soldPrice = formatUnit(watchFields.sold_price || 0, watchFields.sold_price_unit || 'Lacs');
      
      let buyerCommission = watchFields.commission_from_buyer || 0;
      if(watchFields.commission_from_buyer_unit === '%') {
          buyerCommission = (soldPrice * buyerCommission) / 100;
      }

      let sellerCommission = watchFields.commission_from_seller || 0;
      if(watchFields.commission_from_seller_unit === '%') {
          sellerCommission = (soldPrice * sellerCommission) / 100;
      }
      
      return buyerCommission + sellerCommission;
  }, [watchFields]);
  
  useEffect(() => {
    if (isOpen) {
        form.reset({
            sold_price: property.demand_amount,
            sold_price_unit: property.demand_unit,
            sale_date: new Date().toISOString().split('T')[0],
            sold_by_agent_id: '',
            commission_from_buyer: 0,
            commission_from_buyer_unit: 'PKR',
            commission_from_seller: 0,
            commission_from_seller_unit: 'PKR',
            agent_share_percentage: 0,
        });
    }
  }, [isOpen, property, form]);

  async function onSubmit(values: MarkAsSoldFormValues) {
    const agent = activeAgents.find(a => a.id === values.sold_by_agent_id);
    if (!agent) return;

    const soldPriceInBaseUnit = formatUnit(values.sold_price, values.sold_price_unit);

    const updatedProperty: Property = {
        ...property,
        status: 'Sold',
        sold_price: soldPriceInBaseUnit,
        sold_price_unit: values.sold_price_unit,
        sale_date: values.sale_date,
        sold_by_agent_id: values.sold_by_agent_id,
        commission_from_buyer: values.commission_from_buyer,
        commission_from_buyer_unit: values.commission_from_buyer_unit,
        commission_from_seller: values.commission_from_seller,
        commission_from_seller_unit: values.commission_from_seller_unit,
        total_commission: totalCommission,
        agent_share_percentage: values.agent_share_percentage,
    };
    onUpdateProperty(updatedProperty);
    
    // Create activity log
    const activityLogRef = collection(firestore, 'agencies', profile.agency_id, 'activityLogs');
    const newActivity = {
        userName: profile.name,
        userAvatar: profile.avatar,
        action: `marked property as "Sold"`,
        target: `${property.serial_no} to ${agent.name} for ${formatCurrency(soldPriceInBaseUnit, currency)}`,
        targetType: 'Property',
        timestamp: new Date().toISOString(),
        agency_id: profile.agency_id,
    };
    await addDoc(activityLogRef, newActivity);

    toast({
      title: 'Property Marked as Sold',
      description: `${property.auto_title} has been updated.`,
    });
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Mark Property as Sold</DialogTitle>
          <DialogDescription>
            Enter the final sale details for: {property.auto_title}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                <h4 className="text-sm font-medium text-muted-foreground">Sale Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid grid-cols-2 gap-2">
                        <FormField
                        control={form.control}
                        name="sold_price"
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
                        name="sold_price_unit"
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
                        name="sale_date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Sale Date</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                 <FormField
                    control={form.control}
                    name="sold_by_agent_id"
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

                <Separator />
                <h4 className="text-sm font-medium text-muted-foreground">Commission Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="grid grid-cols-2 gap-2">
                        <FormField control={form.control} name="commission_from_buyer" render={({field}) => (
                            <FormItem><FormLabel>From Buyer</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="commission_from_buyer_unit" render={({field}) => (
                            <FormItem className="self-end"><FormLabel className="sr-only">Unit</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>
                                <SelectItem value="PKR">PKR</SelectItem><SelectItem value="%">%</SelectItem>
                            </SelectContent></Select><FormMessage /></FormItem>
                        )} />
                    </div>
                     <div className="grid grid-cols-2 gap-2">
                        <FormField control={form.control} name="commission_from_seller" render={({field}) => (
                            <FormItem><FormLabel>From Seller</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="commission_from_seller_unit" render={({field}) => (
                            <FormItem className="self-end"><FormLabel className="sr-only">Unit</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>
                                <SelectItem value="PKR">PKR</SelectItem><SelectItem value="%">%</SelectItem>
                            </SelectContent></Select><FormMessage /></FormItem>
                        )} />
                    </div>
                </div>

                 <FormField control={form.control} name="agent_share_percentage" render={({field}) => (
                    <FormItem>
                        <FormLabel>Agent's Share (%)</FormLabel>
                        <FormControl><Input type="number" {...field} placeholder="e.g. 50" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

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
                <Button type="submit">Save & Mark as Sold</Button>
               </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
