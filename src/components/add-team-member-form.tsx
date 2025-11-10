
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
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import type { User, UserRole } from '@/lib/types';

const userRoles: UserRole[] = ['Admin', 'Agent', 'Editor'];

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.enum(userRoles).default('Agent'),
});

type AddTeamMemberFormValues = z.infer<typeof formSchema>;

interface AddTeamMemberFormProps {
  setDialogOpen: (open: boolean) => void;
  memberToEdit?: User | null;
  onSave: (member: User) => void;
}

const getInitialFormValues = (memberToEdit: User | null | undefined): AddTeamMemberFormValues => {
    if (memberToEdit) {
        return {
            name: memberToEdit.name || '',
            email: memberToEdit.email || '',
            phone: memberToEdit.phone || '',
            role: memberToEdit.role || 'Agent',
        };
    }
    return {
        name: '',
        email: '',
        phone: '',
        role: 'Agent',
    };
};

export function AddTeamMemberForm({ setDialogOpen, memberToEdit, onSave }: AddTeamMemberFormProps) {
  const { toast } = useToast();
  const form = useForm<AddTeamMemberFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialFormValues(memberToEdit)
  });

  const { reset } = form;

  useEffect(() => {
    reset(getInitialFormValues(memberToEdit));
  }, [memberToEdit, reset]);

  function onSubmit(values: AddTeamMemberFormValues) {
     const memberData = {
        ...(memberToEdit || {}),
        ...values,
        id: memberToEdit?.id || '', // ID is handled in the parent page
    } as User;
    
    onSave(memberData);
    toast({
      title: memberToEdit ? 'Member Updated' : 'Member Added',
      description: `"${values.name}" has been successfully ${memberToEdit ? 'updated' : 'added'}.`,
    });
    setDialogOpen(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Ali Khan" />
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
                <Input type="email" {...field} placeholder="agent@example.com" />
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
              <FormLabel>Phone (Optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="+92 300 1234567" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {userRoles.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" className="glowing-btn">{memberToEdit ? 'Save Changes' : 'Add Member'}</Button>
        </div>
      </form>
    </Form>
  );
}
