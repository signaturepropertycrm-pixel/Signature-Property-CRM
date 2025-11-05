
'use client';

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { generateAutoTitle } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import type { Property } from '@/lib/types';

const formSchema = z.object({
  serial_no: z.string().optional(),
  auto_title: z.string().optional(),
  owner_number: z.string().min(1, 'Owner number is required'),
  city: z.string().default('Lahore'),
  area: z.string().min(1, 'Area is required'),
  address: z.string().min(1, 'Address is required'),
  property_type: z.enum(['House', 'Plot', 'Flat', 'Shop', 'Commercial', 'Agricultural', 'Other']),
  size_value: z.coerce.number().positive('Size must be positive'),
  size_unit: z.enum(['Marla', 'SqFt', 'Kanal', 'Acre', 'Maraba']).default('Marla'),
  road_size_ft: z.coerce.number().int().optional(),
  storey: z.string().optional(),
  meters: z.object({
    electricity: z.boolean().default(false),
    gas: z.boolean().default(false),
    water: z.boolean().default(false),
  }),
  potential_rent_amount: z.coerce.number().optional(),
  potential_rent_unit: z.enum(['Thousand', 'Lacs', 'Crore']).optional(),
  front_ft: z.coerce.number().int().optional(),
  length_ft: z.coerce.number().int().optional(),
  demand_amount: z.coerce.number().positive('Demand must be positive'),
  demand_unit: z.enum(['Lacs', 'Crore']).default('Lacs'),
  documents: z.string().optional(),
});

type AddPropertyFormValues = z.infer<typeof formSchema>;

interface AddPropertyFormProps {
  setDialogOpen: (open: boolean) => void;
  propertyToEdit?: Property | null;
}

export function AddPropertyForm({ setDialogOpen, propertyToEdit }: AddPropertyFormProps) {
  const { toast } = useToast();
  const form = useForm<AddPropertyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: propertyToEdit ? {
        ...propertyToEdit,
        potential_rent_unit: propertyToEdit.potential_rent_unit || undefined,
        demand_unit: propertyToEdit.demand_unit,
    } : {
      city: 'Lahore',
      property_type: 'House',
      size_unit: 'Marla',
      demand_unit: 'Lacs',
      meters: { electricity: false, gas: false, water: false },
      serial_no: `P-${Math.floor(1 + Math.random() * 999)}`
    },
  });

  const { control, setValue, formState } = form;
  const watchedFields = useWatch({
    control,
    name: ['size_value', 'size_unit', 'property_type', 'area'],
  });

  useEffect(() => {
    const [sizeValue, sizeUnit, propertyType, area] = watchedFields;
    const handler = setTimeout(async () => {
      if (sizeValue && sizeUnit && propertyType && area) {
        try {
          const { autoTitle } = await generateAutoTitle({
            sizeValue,
            sizeUnit,
            propertyType,
            area,
          });
          setValue('auto_title', autoTitle);
        } catch (error) {
          console.error('Failed to generate auto title:', error);
        }
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [watchedFields, setValue]);

  function onSubmit(values: AddPropertyFormValues) {
    console.log(values);
    toast({
      title: propertyToEdit ? 'Property Updated!' : 'Property Added!',
      description: `Property "${values.auto_title}" has been successfully ${propertyToEdit ? 'updated' : 'added'}.`,
    });
    setDialogOpen(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ScrollArea className="h-[65vh] pr-6">
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={control}
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
                <FormLabel>Date Added</FormLabel>
                <Input value={propertyToEdit ? new Date(propertyToEdit.created_at).toLocaleDateString() : new Date().toLocaleDateString()} readOnly className="bg-muted/50" />
              </FormItem>
            </div>
            
            <FormField
              control={control}
              name="auto_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Auto-Generated Title</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly placeholder="e.g. 5 Marla House in Harbanspura" className="bg-muted/50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />
             <h4 className="text-sm font-medium text-muted-foreground">Location Details</h4>

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Lahore">Lahore</SelectItem>
                        <SelectItem value="Karachi">Karachi</SelectItem>
                        <SelectItem value="Islamabad">Islamabad</SelectItem>
                        <SelectItem value="Faisalabad">Faisalabad</SelectItem>
                        <SelectItem value="Rawalpindi">Rawalpindi</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. DHA Phase 5" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Address</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Full property address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />
            <h4 className="text-sm font-medium text-muted-foreground">Property Specification</h4>

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name="property_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="House">House</SelectItem>
                        <SelectItem value="Plot">Plot</SelectItem>
                        <SelectItem value="Flat">Flat</SelectItem>
                        <SelectItem value="Shop">Shop</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                        <SelectItem value="Agricultural">Agricultural</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={control}
                  name="size_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Size</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} placeholder="5" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="size_unit"
                  render={({ field }) => (
                    <FormItem className="self-end">
                      <FormLabel className="sr-only">Unit</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Marla">Marla</SelectItem>
                          <SelectItem value="SqFt">SqFt</SelectItem>
                          <SelectItem value="Kanal">Kanal</SelectItem>
                          <SelectItem value="Acre">Acre</SelectItem>
                          <SelectItem value="Maraba">Maraba</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name="front_ft"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Front (ft)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} placeholder="25" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={control}
                name="length_ft"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Length (ft)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} placeholder="45" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name="road_size_ft"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Road Size (ft)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} placeholder="20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="storey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storey</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Single, Double, etc." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

             <Separator />
            <h4 className="text-sm font-medium text-muted-foreground">Financials & Contact</h4>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={control}
                  name="demand_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Demand</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} placeholder="90" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="demand_unit"
                  render={({ field }) => (
                    <FormItem className="self-end">
                      <FormLabel className="sr-only">Unit</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Lacs">Lacs</SelectItem>
                          <SelectItem value="Crore">Crore</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={control}
                  name="potential_rent_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Potential Rent</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} placeholder="30" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="potential_rent_unit"
                  render={({ field }) => (
                    <FormItem className="self-end">
                      <FormLabel className="sr-only">Unit</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Unit" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Thousand">Thousand</SelectItem>
                          <SelectItem value="Lacs">Lacs</SelectItem>
                          <SelectItem value="Crore">Crore</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={control}
              name="owner_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="+92 300 1234567" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />
            <h4 className="text-sm font-medium text-muted-foreground">Utilities & Documents</h4>

            <FormItem>
              <FormLabel>Meters</FormLabel>
              <div className="flex items-center gap-6 pt-2">
                <FormField
                  control={control}
                  name="meters.electricity"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel>Electricity</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="meters.gas"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel>Gas</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="meters.water"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel>Water</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </FormItem>
            
            <FormField
              control={control}
              name="documents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Documents</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="e.g. Registry, Fard, Transfer papers" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" className="glowing-btn">{propertyToEdit ? 'Save Changes' : 'Save Property'}</Button>
        </div>
      </form>
    </Form>
  );
}
