
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
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long.').optional(),
  phone: z.string().optional(),
  role: z.enum(userRoles).default('Agent'),
});

// Refine schema to make password required only when NOT editing a user
const refinedSchema = (isEditing: boolean) => isEditing 
? formSchema 
: formSchema.refine(data => !!data.password, {
    message: "Password is required for new members.",
    path: ["password"],
});


type AddTeamMemberFormValues = z.infer<typeof formSchema>;

interface AddTeamMemberFormProps {
  setDialogOpen: (open: boolean) => void;
  memberToEdit?: User | null;
  onSave: (member: AddTeamMemberFormValues) => void;
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
        password: '',
    };
};

export function AddTeamMemberForm({ setDialogOpen, memberToEdit, onSave }: AddTeamMemberFormProps) {
  const { toast } = useToast();
  const isEditing = !!memberToEdit;
  
  const form = useForm<AddTeamMemberFormValues>({
    resolver: zodResolver(refinedSchema(isEditing)),
    defaultValues: getInitialFormValues(memberToEdit)
  });

  const { reset } = form;

  useEffect(() => {
    reset(getInitialFormValues(memberToEdit));
  }, [memberToEdit, reset]);

  function onSubmit(values: AddTeamMemberFormValues) {
    // If editing, don't send an empty password field
    if (isEditing) {
        delete values.password;
    }
    onSave(values);
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
                <Input {...field} value={field.value ?? ''} placeholder="e.g. Ali Khan" />
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} value={field.value ?? ''} placeholder="agent@example.com" disabled={!!memberToEdit} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!memberToEdit && (
             <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                        <Input type="password" {...field} value={field.value ?? ''} placeholder="••••••••" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        )}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone (Optional)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} placeholder="+92 300 1234567" />
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
