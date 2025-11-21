
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
import type { User, UserRole } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase/provider';
import { doc, setDoc, serverTimestamp, writeBatch, updateDoc } from 'firebase/firestore';
import { useProfile } from '@/context/profile-context';

const roles: UserRole[] = ['Editor', 'Agent'];

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(roles),
});

type AddMemberFormValues = z.infer<typeof formSchema>;

interface AddTeamMemberFormProps {
  setDialogOpen: (open: boolean) => void;
  memberToEdit?: User | null;
}

export function AddTeamMemberForm({ setDialogOpen, memberToEdit }: AddTeamMemberFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { profile } = useProfile();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AddMemberFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'Agent',
    },
  });

  useEffect(() => {
    if (memberToEdit) {
      form.reset({
        name: memberToEdit.name,
        email: memberToEdit.email,
        role: memberToEdit.role,
        password: '', // Password is not edited
      });
    } else {
        form.reset({ name: '', email: '', password: '', role: 'Agent' });
    }
  }, [memberToEdit, form]);

  const handleSaveMember = async (values: AddMemberFormValues) => {
    if (!profile.agency_id) {
        toast({ title: "Error", description: "Agency information not found.", variant: "destructive" });
        return;
    }
    
    setIsLoading(true);

    try {
        if (memberToEdit) {
            // Update existing member logic
            const batch = writeBatch(firestore);
            
            const memberRef = doc(firestore, 'agencies', profile.agency_id, 'teamMembers', memberToEdit.id);
            batch.update(memberRef, { role: values.role });

            const userRef = doc(firestore, 'users', memberToEdit.id);
            batch.update(userRef, { role: values.role });

            // Handle role indicator changes
            const oldRole = memberToEdit.role.toLowerCase();
            const newRole = values.role.toLowerCase();
            if (oldRole !== newRole && oldRole !== 'admin') {
                batch.delete(doc(firestore, `roles_${oldRole}`, memberToEdit.id));
            }
             if (oldRole !== newRole) {
                batch.set(doc(firestore, `roles_${newRole}`, memberToEdit.id), { uid: memberToEdit.id });
             }

            await batch.commit();

            toast({ title: 'Member Updated', description: `${values.name}'s role has been updated.` });

        } else {
            // Add new member logic
            if (!values.password) {
                form.setError('password', { message: 'Password is required for new members.' });
                setIsLoading(false);
                return;
            }

            // This is a placeholder for a Cloud Function that would create the auth user
            // We cannot create a user with email/password on the client without logging out the admin
            // For now, we will create the Firestore documents.
            
            // This is a temporary UID, a Cloud Function would replace this with a real one
            const tempNewUserId = doc(collection(firestore, 'users')).id;

            const batch = writeBatch(firestore);

            // 1. Create team member doc inside agency
            const teamMemberRef = doc(firestore, 'agencies', profile.agency_id, 'teamMembers', tempNewUserId);
            batch.set(teamMemberRef, {
                id: tempNewUserId,
                name: values.name,
                email: values.email,
                role: values.role,
                createdAt: serverTimestamp()
            });

            // 2. Create the main user doc
            const userRef = doc(firestore, 'users', tempNewUserId);
            batch.set(userRef, {
                id: tempNewUserId,
                name: values.name,
                email: values.email,
                role: values.role,
                agency_id: profile.agency_id, // Assign to Admin's agency
                createdAt: serverTimestamp()
            });

            // 3. Create the role document
            const roleCollection = values.role === 'Agent' ? 'roles_agent' : 'roles_editor';
            const roleRef = doc(firestore, roleCollection, tempNewUserId);
            batch.set(roleRef, { uid: tempNewUserId });

            await batch.commit();

            toast({ 
                title: 'Member Added (Pending Auth)', 
                description: `${values.name} has been added. They need to be manually created in Firebase Auth with email: ${values.email} and UID: ${tempNewUserId}` 
            });
        }
        setDialogOpen(false);
    } catch (error: any) {
        console.error("Error saving member:", error);
        toast({
            title: 'An Error Occurred',
            description: error.message || 'Could not save the team member. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSaveMember)} className="space-y-4">
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} placeholder="member@example.com" disabled={!!memberToEdit} />
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
                <FormLabel>Password (for manual auth creation)</FormLabel>
                <FormControl>
                    <Input type="password" {...field} placeholder="••••••••" />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        )}
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles.map(role => (
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
          <Button type="submit" className="glowing-btn" disabled={isLoading}>
            {isLoading ? 'Saving...' : (memberToEdit ? 'Save Changes' : 'Add Member')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
