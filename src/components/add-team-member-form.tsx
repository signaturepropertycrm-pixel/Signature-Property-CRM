
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
import { useAuth, useFirestore } from '@/firebase/provider';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
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
  const auth = useAuth();
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
            const memberRef = doc(firestore, 'agencies', profile.agency_id, 'teamMembers', memberToEdit.id);
            const userRef = doc(firestore, 'users', memberToEdit.id);

            const batch = writeBatch(firestore);
            batch.update(memberRef, { name: values.name, role: values.role });
            batch.update(userRef, { name: values.name, role: values.role });

            // Handle role changes
            const oldRole = memberToEdit.role.toLowerCase();
            const newRole = values.role.toLowerCase();
            if (oldRole !== newRole) {
                if(oldRole !== 'admin') await deleteDoc(doc(firestore, `roles_${oldRole}`, memberToEdit.id));
                await setDoc(doc(firestore, `roles_${newRole}`, memberToEdisrc/components/add-team-member-form.tsxt.id), { uid: memberToEdit.id });
            }

            await batch.commit();

            toast({ title: 'Member Updated', description: `${values.name}'s details have been updated.` });

        } else {
            // Add new member logic
            if (!values.password) {
                form.setError('password', { message: 'Password is required for new members.' });
                setIsLoading(false);
                return;
            }

            // This part creates a temporary auth client to not affect the current admin's session.
            const { initializeApp, getApps, getApp } = await import('firebase/app');
            const { getAuth: getTempAuth } = await import('firebase/auth');
            
            const tempAppName = `temp-signup-${Date.now()}`;
            const firebaseConfig = {
                apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            };

            const tempApp = getApps().find(app => app.name === tempAppName) || initializeApp(firebaseConfig, tempAppName);
            const tempAuth = getTempAuth(tempApp);

            const userCredential = await createUserWithEmailAndPassword(tempAuth, values.email, values.password);
            const newUser = userCredential.user;

            const batch = writeBatch(firestore);

            // 1. Create team member doc inside agency
            const teamMemberRef = doc(firestore, 'agencies', profile.agency_id, 'teamMembers', newUser.uid);
            batch.set(teamMemberRef, {
                id: newUser.uid,
                name: values.name,
                email: values.email,
                role: values.role,
                createdAt: serverTimestamp()
            });

            // 2. Create the main user doc
            const userRef = doc(firestore, 'users', newUser.uid);
            batch.set(userRef, {
                id: newUser.uid,
                name: values.name,
                email: values.email,
                role: values.role,
                agency_id: profile.agency_id, // Assign to Admin's agency
                createdAt: serverTimestamp()
            });

            // 3. Create the role document
            const roleCollection = values.role === 'Agent' ? 'roles_agent' : 'roles_editor';
            const roleRef = doc(firestore, roleCollection, newUser.uid);
            batch.set(roleRef, { uid: newUser.uid });

            await batch.commit();

            toast({ title: 'Member Added', description: `${values.name} has been added to your team.` });
        }
        setDialogOpen(false);
    } catch (error: any) {
        console.error("Error saving member:", error);
        toast({
            title: 'An Error Occurred',
            description: error.code === 'auth/email-already-in-use' ? 'This email is already in use.' : 'Could not save the team member. Please try again.',
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
                <FormLabel>Password</FormLabel>
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
