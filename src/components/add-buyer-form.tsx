

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import type { Buyer, BuyerStatus, PriceUnit, PropertyType, SizeUnit } from '@/lib/types';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';

const buyerStatuses: BuyerStatus[] = [
    'New', 'Contacted', 'Interested', 'Not Interested', 'Follow Up',
    'Pending Response', 'Need More Info', 'Visited Property',
    'Deal Closed', 'Hot Lead', 'Cold Lead'
];

const propertyTypes: PropertyType[] = ['House', 'Plot', 'Flat', 'Shop', 'Commercial', 'Agricultural', 'Other'];
const sizeUnits: SizeUnit[] = ['Marla', 'SqFt', 'Kanal', 'Acre', 'Maraba'];
const priceUnits: PriceUnit[] = ['Thousand', 'Lacs', 'Crore'];


const formSchema = z.object({
  id: z.string().optional(),
  serial_no: z.string().optional(),
  name: z.string().min(1, 'Buyer name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  status: z.enum(buyerStatuses).default('New'),
  area_preference: z.string().optional(),
  property_type_preference: z.string().optional(),
  size_min_value: z.coerce.number().optional(),
  size_min_unit: z.enum(sizeUnits).optional(),
  size_max_value: z.coerce.number().optional(),
  size_max_unit: z.enum(sizeUnits).optional(),
  budget_min_amount: z.coerce.number().optional(),
  budget_min_unit: z.enum(priceUnits).optional(),
  budget_max_amount: z.coerce.number().optional(),
  budget_max_unit: z.enum(priceUnits).optional(),
  notes: z.string().optional(),
  created_at: z.string().optional(),
});

type AddBuyerFormValues = z.infer<typeof formSchema>;

interface AddBuyerFormProps {
  setDialogOpen: (open: boolean) => void;
  totalBuyers: number;
  buyerToEdit?: Buyer | null;
  onSave: (buyer: Buyer) => void;
}

const getInitialFormValues = (totalBuyers: number, buyerToEdit: Buyer | null | undefined): AddBuyerFormValues => {
    if (buyerToEdit) {
        return {
            ...buyerToEdit,
            property_type_preference: buyerToEdit.property_type_preference || '',
            size_min_unit: buyerToEdit.size_min_unit || 'Marla',
            size_max_unit: buyerToEdit.size_max_unit || 'Marla',
            budget_min_unit: buyerToEdit.budget_min_unit || 'Lacs',
            budget_max_unit: buyerToEdit.budget_max_unit || 'Lacs',
            name: buyerToEdit.name || '',
            phone: buyerToEdit.phone || '',
            email: buyerToEdit.email || '',
            area_preference: buyerToEdit.area_preference || '',
            notes: buyerToEdit.notes || '',
            size_min_value: buyerToEdit.size_min_value,
            size_max_value: buyerToEdit.size_max_value,
            budget_min_amount: buyerToEdit.budget_min_amount,
            budget_max_amount: buyerToEdit.budget_max_amount,
        };
    }
    return {
        id: `B-${totalBuyers + 1}`,
        name: '',
        phone: '',
        email: '',
        area_preference: '',
        property_type_preference: '',
        notes: '',
        status: 'New',
        serial_no: `B-${totalBuyers + 1}`,
        size_min_unit: 'Marla',
        size_max_unit: 'Marla',
        budget_min_unit: 'Lacs',
        budget_max_unit: 'Lacs',
        size_min_value: undefined,
        size_max_value: undefined,
        budget_min_amount: undefined,
        budget_max_amount: undefined,
        created_at: new Date().toISOString(),
    };
};


export function AddBuyerForm({ setDialogOpen, totalBuyers, buyerToEdit, onSave }: AddBuyerFormProps) {
  const { toast } = useToast();
  const form = useForm<AddBuyerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialFormValues(totalBuyers, buyerToEdit)
  });

  const { reset } = form;

  useEffect(() => {
    reset(getInitialFormValues(totalBuyers, buyerToEdit));
  }, [buyerToEdit, totalBuyers, reset]);

  function onSubmit(values: AddBuyerFormValues) {
    onSave(values as Buyer);
    toast({
      title: buyerToEdit ? 'Buyer Updated' : 'Buyer Added',
      description: `Buyer "${values.name}" has been successfully ${buyerToEdit ? 'updated' : 'added'}.`,
    });
    setDialogOpen(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ScrollArea className="h-[60vh] pr-6 -mr-6">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="serial_no"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Serial No</FormLabel>
                        <FormControl>
                            <Input {...field} readOnly className="bg-muted/50" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormItem>
                        <FormLabel>Date</FormLabel>
                        <Input value={new Date(form.getValues('created_at') || new Date()).toLocaleDateString()} readOnly className="bg-muted/50" />
                    </FormItem>
                </div>
                
                <Separator />
                <h4 className="text-sm font-medium text-muted-foreground">Contact Information</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="e.g. Ali Khan" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="+92 300 1234567" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                        <Input type="email" {...field} placeholder="buyer@example.com" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <Separator />
                <h4 className="text-sm font-medium text-muted-foreground">Buyer Requirements</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="area_preference"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Area Preference</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="e.g. DHA, Bahria, Gulberg" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                        name="property_type_preference"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Property Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {propertyTypes.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <FormLabel>Size Preference</FormLabel>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <FormField control={form.control} name="size_min_value" render={({field}) => (
                                <FormItem><FormControl><Input type="number" {...field} value={field.value ?? ''} placeholder="Min" /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="size_min_unit" render={({field}) => (
                                <FormItem><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>
                                    {sizeUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                </SelectContent></Select></FormItem>
                            )} />
                            <FormField control={form.control} name="size_max_value" render={({field}) => (
                                <FormItem><FormControl><Input type="number" {...field} value={field.value ?? ''} placeholder="Max" /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="size_max_unit" render={({field}) => (
                                <FormItem><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>
                                    {sizeUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                </SelectContent></Select></FormItem>
                            )} />
                        </div>
                    </div>
                    <div>
                        <FormLabel>Budget Range</FormLabel>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <FormField control={form.control} name="budget_min_amount" render={({field}) => (
                                <FormItem><FormControl><Input type="number" {...field} value={field.value ?? ''} placeholder="Min" /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="budget_min_unit" render={({field}) => (
                                <FormItem><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>
                                    {priceUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                </SelectContent></Select></FormItem>

                            )} />
                            <FormField control={form.control} name="budget_max_amount" render={({field}) => (
                                <FormItem><FormControl><Input type="number" {...field} value={field.value ?? ''} placeholder="Max" /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="budget_max_unit" render={({field}) => (
                                <FormItem><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>
                                    {priceUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                </SelectContent></Select></FormItem>
                            )} />
                        </div>
                    </div>
                </div>

                <Separator />
                <h4 className="text-sm font-medium text-muted-foreground">Status & Notes</h4>

                <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Other Requirements / Notes</FormLabel>
                    <FormControl>
                        <Textarea {...field} placeholder="Any specific requirements or notes..." />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" className="glowing-btn">{buyerToEdit ? 'Save Changes' : 'Save Buyer'}</Button>
        </div>
      </form>
    </Form>
  );
}

    