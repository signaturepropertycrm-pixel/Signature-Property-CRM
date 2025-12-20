

'use client';

import { useEffect, useState } from 'react';
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
// import { generateAutoTitle } from '@/ai/flows/auto-title-generation';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import type { Property, PropertyType } from '@/lib/types';
import { useUser } from '@/firebase/auth/use-user';
import { useProfile } from '@/context/profile-context';
import { formatPhoneNumber } from '@/lib/utils';
import { punjabCities, countryCodes } from '@/lib/data';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';

const propertyTypes: (PropertyType | 'Other')[] = [
    'House', 'Flat', 'Farm House', 'Penthouse', 'Plot', 'Residential Plot', 'Commercial Plot', 'Agricultural Land', 'Industrial Land', 'Office', 'Shop', 'Warehouse', 'Factory', 'Building', 'Residential Property', 'Commercial Property', 'Semi Commercial', 'Other'
];

/* ---------- schema ---------- */
const formSchema = z.object({
  serial_no: z.string().optional(),
  auto_title: z.string().optional(),
  country_code: z.string().default('+92'),
  owner_number: z.string().min(1, 'Owner number is required'),
  city: z.string().default('Lahore'),
  area: z.string().min(1, 'Area is required'),
  address: z.string().min(1, 'Address is required'),
  property_type: z.enum(propertyTypes),
  property_type_other: z.string().optional(),
  size_value: z.coerce.number().positive('Size must be positive'),
  size_unit: z.enum(['Marla', 'SqFt', 'Kanal', 'Acre', 'Maraba']).default('Marla'),
  storey: z.string().optional(),
  meters: z.object({
    electricity: z.boolean().default(false),
    gas: z.boolean().default(false),
    water: z.boolean().default(false),
  }),
  demand_amount: z.coerce
    .number({ invalid_type_error: 'Rent amount must be a number.' })
    .positive('Rent amount must be positive'),
  demand_unit: z.enum(['Thousand', 'Lacs', 'Crore']).default('Thousand'),
  message: z.string().optional(),
});

type AddRentPropertyFormValues = z.infer<typeof formSchema>;

/* ---------- defaults ---------- */
const getNewPropertyDefaults = (
  totalProperties: number,
  userId: string | undefined,
  agencyId: string | undefined
): AddRentPropertyFormValues => ({
  serial_no: `RP-${totalProperties + 1}`,
  auto_title: '',
  country_code: '+92',
  owner_number: '',
  city: 'Lahore',
  area: '',
  address: '',
  property_type: 'House',
  property_type_other: '',
  size_value: 0,
  size_unit: 'Marla',
  storey: '',
  meters: { electricity: false, gas: false, water: false },
  demand_amount: 0,
  demand_unit: 'Thousand',
  message: '',
});

/* ---------- component ---------- */
interface AddRentPropertyFormProps {
  setDialogOpen: (open: boolean) => void;
  onSave: (property: Omit<Property, 'id'>) => void;
  propertyToEdit?: Property | null;
  totalProperties: number;
}

export function AddRentPropertyForm({
  setDialogOpen,
  onSave,
  propertyToEdit,
  totalProperties,
}: AddRentPropertyFormProps) {
  const { user } = useUser();
  const { profile } = useProfile();
  const [countryCodePopoverOpen, setCountryCodePopoverOpen] = useState(false);

  const form = useForm<AddRentPropertyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getNewPropertyDefaults(totalProperties, user?.uid, profile.agency_id),
  });

  const { control, setValue, reset } = form;

  const watchedFields = useWatch({
    control,
    name: ['size_value', 'size_unit', 'property_type', 'area', 'property_type_other'],
  });

  const watchedPropertyType = watchedFields[2];

  /* initialise / edit */
  useEffect(() => {
    if (propertyToEdit) {
      const phoneWithoutCode = propertyToEdit.owner_number.replace(propertyToEdit.country_code || '+92', '');
      const isOtherType = !propertyTypes.includes(propertyToEdit.property_type as any);

      reset({
        ...propertyToEdit,
        country_code: propertyToEdit.country_code || '+92',
        owner_number: phoneWithoutCode,
        demand_unit: propertyToEdit.demand_unit ?? 'Thousand',
        demand_amount: propertyToEdit.demand_amount || 0,
        size_value: propertyToEdit.size_value || 0,
        storey: propertyToEdit.storey || '',
        message: propertyToEdit.message || '',
        property_type: isOtherType ? 'Other' : propertyToEdit.property_type,
        property_type_other: isOtherType ? propertyToEdit.property_type : '',
      });
    } else {
      reset(getNewPropertyDefaults(totalProperties, user?.uid, profile.agency_id));
    }
  }, [propertyToEdit, totalProperties, reset, user, profile.agency_id]);

  /* auto title */
  useEffect(() => {
    const [sizeValue, sizeUnit, propertyType, area, otherType] = watchedFields;
    const finalPropertyType = propertyType === 'Other' ? otherType : propertyType;

    if (sizeValue && sizeUnit && finalPropertyType && area) {
        const title = `${sizeValue} ${sizeUnit} ${finalPropertyType} for rent in ${area}`;
        setValue('auto_title', title);
    }
}, [watchedFields, setValue]);


  /* submit */
  function onSubmit(values: AddRentPropertyFormValues) {
    const finalPropertyType = values.property_type === 'Other' && values.property_type_other
        ? values.property_type_other
        : values.property_type;

    const finalValues = {
      ...values,
      owner_number: formatPhoneNumber(values.owner_number, values.country_code),
      property_type: finalPropertyType,
    };

    const propertyData: Omit<Property, 'id'> = {
      ...propertyToEdit,
      ...finalValues,
      listing_type: 'For Rent',
      is_for_rent: true,
      potential_rent_amount: 0,
      potential_rent_unit: 'Thousand',
      id: propertyToEdit?.id,
      serial_no: propertyToEdit?.serial_no || `RP-${totalProperties + 1}`,
      status: propertyToEdit?.status || 'Available',
      created_at: propertyToEdit?.created_at || new Date().toISOString(),
      created_by: propertyToEdit?.created_by || user?.uid || '',
      agency_id: propertyToEdit?.agency_id || profile.agency_id || '',
      is_deleted: propertyToEdit?.is_deleted || false,
    };

    onSave(propertyData);
    setDialogOpen(false);
  }

  /* render */
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ScrollArea className="h-[65vh] pr-6">
          <div className="space-y-6">
            {/* Row 1 */}
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
                <Input
                  value={propertyToEdit ? new Date(propertyToEdit.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
                  readOnly
                  className="bg-muted/50"
                />
              </FormItem>
            </div>

            {/* Auto title */}
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
              {/* City */}
              <FormField
                control={control}
                name="city"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>City</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
                          >
                            {field.value ? punjabCities.find((c) => c === field.value) : 'Select city'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Search city..." />
                          <CommandList>
                            <CommandGroup>
                              {punjabCities.map((city) => (
                                <CommandItem
                                  value={city}
                                  key={city}
                                  onSelect={() => form.setValue('city', city)}
                                >
                                  <Check className={cn('mr-2 h-4 w-4', city === field.value ? 'opacity-100' : 'opacity-0')} />
                                  {city}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Area */}
              <FormField
                control={control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. DHA Phase 5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address */}
            <FormField
              control={control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Full property address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />
            <h4 className="text-sm font-medium text-muted-foreground">Property Specification</h4>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Property Type */}
              <FormField
                control={control}
                name="property_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {propertyTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {watchedPropertyType === 'Other' && (
                  <FormField
                    control={control}
                    name="property_type_other"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Property Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Penthouse" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              )}

              {/* Size + Unit */}
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={control}
                  name="size_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Size</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="5" {...field} />
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
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

            {/* Storey */}
            <FormField
              control={control}
              name="storey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portion / Unit Details</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Ground Portion, Upper Portion, Full House" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />
            <h4 className="text-sm font-medium text-muted-foreground">Financials & Contact</h4>

            {/* Rent Amount */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={control}
                  name="demand_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rent Amount</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="30" {...field} />
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Owner Number */}
              <FormItem>
                <FormLabel>Owner Number</FormLabel>
                <div className="flex gap-2">
                  <FormField
                    control={control}
                    name="country_code"
                    render={({ field }) => (
                      <FormItem className="w-1/3">
                        <Popover open={countryCodePopoverOpen} onOpenChange={setCountryCodePopoverOpen}>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant="outline"
                                role="combobox"
                                className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                                >
                                {field.value || "Code"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search code..." />
                                <CommandList>
                                <CommandEmpty>No country found.</CommandEmpty>
                                <CommandGroup>
                                    {countryCodes.map((country) => (
                                    <CommandItem
                                        value={country.dial_code}
                                        key={country.code}
                                        onSelect={() => {
                                            form.setValue("country_code", country.dial_code);
                                            setCountryCodePopoverOpen(false);
                                        }}
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", country.dial_code === field.value ? "opacity-100" : "opacity-0")} />
                                        {country.dial_code} ({country.code})
                                    </CommandItem>
                                    ))}
                                </CommandGroup>
                                </CommandList>
                            </Command>
                            </PopoverContent>
                        </Popover>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="owner_number"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="3001234567" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormMessage>{form.formState.errors.owner_number?.message}</FormMessage>
              </FormItem>
            </div>

            <Separator />
            <h4 className="text-sm font-medium text-muted-foreground">Utilities & Notes</h4>

            {/* Meters */}
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

            {/* Message */}
            <FormField
              control={control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message / Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g. Only for small families, no pets allowed, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" className="glowing-btn">
            {propertyToEdit ? 'Save Changes' : 'Save Property'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
