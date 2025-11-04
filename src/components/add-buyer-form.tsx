
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

const formSchema = z.object({
  serial_no: z.string().optional(),
  name: z.string().min(1, 'Buyer name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  status: z.enum(['New', 'Contacted', 'Interested', 'Not Interested', 'Closed']).default('New'),
  notes: z.string().optional(),
});

type AddBuyerFormValues = z.infer<typeof formSchema>;

interface AddBuyerFormProps {
  setDialogOpen: (open: boolean) => void;
}

export function AddBuyerForm({ setDialogOpen }: AddBuyerFormProps) {
  const { toast } = useToast();
  const form = useForm<AddBuyerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'New',
    },
  });

  useEffect(() => {
    // Set serial number on mount
    form.setValue('serial_no', `B-${Math.floor(1000 + Math.random() * 9000)}`);
  }, [form]);

  function onSubmit(values: AddBuyerFormValues) {
    console.log(values);
    toast({
      title: 'Buyer Added',
      description: `Buyer "${values.name}" has been successfully added.`,
    });
    setDialogOpen(false);
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <Input value={new Date().toLocaleDateString()} readOnly className="bg-muted/50" />
            </FormItem>
        </div>
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
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Interested">Interested</SelectItem>
                  <SelectItem value="Not Interested">Not Interested</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
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
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Any specific requirements or notes..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" className="glowing-btn">Save Buyer</Button>
        </div>
      </form>
    </Form>
  );
}
