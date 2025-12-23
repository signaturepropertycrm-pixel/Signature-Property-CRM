
'use client';

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
import { useToast } from '@/hooks/use-toast';
import type { User, UserRole } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useFirestore, useAuth } from '@/firebase/provider';
import { doc, setDoc, serverTimestamp, writeBatch, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { useProfile } from '@/context/profile-context';
import { Loader2 } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const roles: UserRole[] = ['Admin', 'Agent', 'Video Recorder'];

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(roles).default('Agent'),
  password: z.string().optional(),
}).refine(data => {
    // Password is only required if the role is 'Video Recorder' and it's not an edit operation
    return data.role !== 'Video Recorder' || (data.password && data.password.length >= 6);
}, {
    message: "Password must be at least 6 characters for Video Recorder role.",
    path: ["password"],
});


type AddMemberFormValues = z.infer<typeof formSchema>;

interface AddTeamMemberFormProps {
  setDialogOpen: (open: boolean) => void;
  memberToEdit?: User | null;
  onRoleChange: (role: UserRole) => void;
}

export function AddTeamMemberForm({ setDialogOpen, memberToEdit, onRoleChange }: AddTeamMemberFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();
  const { profile } = useProfile();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AddMemberFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'Agent',
      password: '',
    },
  });

  const watchedRole = useWatch({ control: form.control, name: 'role' });

  useEffect(() => {
    onRoleChange(watchedRole);
  }, [watchedRole, onRoleChange]);

  useEffect(() => {
    if (memberToEdit) {
      form.reset({
        name: memberToEdit.name,
        email: memberToEdit.email,
        role: memberToEdit.role,
      });
    } else {
        form.reset({ name: '', email: '', role: 'Agent', password: '' });
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
            // Logic to update an existing member's role and name.
            const memberRef = doc(firestore, 'agencies', profile.agency_id, 'teamMembers', memberToEdit.id);
            await updateDoc(memberRef, { role: values.role, name: values.name });
            toast({ title: 'Member Updated', description: `Details for ${values.name} have been updated.` });
        } else {
             // Check if user with this email already exists in the team
            const teamMembersCollectionRef = collection(firestore, 'agencies', profile.agency_id, 'teamMembers');
            const q = query(teamMembersCollectionRef, where("email", "==", values.email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                toast({
                    title: 'Member Already Exists',
                    description: `${values.email} is already a part of this agency.`,
                    variant: 'destructive',
                });
                setIsLoading(false);
                return;
            }

            if (values.role === 'Video Recorder') {
                // Direct creation
                 if (!values.password) {
                     toast({ title: 'Password required for Video Recorder', variant: 'destructive' });
                     setIsLoading(false);
                     return;
                 }
                
                // We cannot use admin SDK on client, so this is a workaround. It's not ideal.
                // A better approach would be a Cloud Function, but we are limited.
                const tempAuth = auth; // This will sign out the admin temporarily.
                const userCredential = await createUserWithEmailAndPassword(tempAuth, values.email, values.password);
                const newUser = userCredential.user;

                const batch = writeBatch(firestore);
                const userDocRef = doc(firestore, 'users', newUser.uid);
                batch.set(userDocRef, {
                    id: newUser.uid,
                    name: values.name,
                    email: values.email,
                    role: 'Video Recorder',
                    agency_id: profile.agency_id,
                    createdAt: serverTimestamp()
                });
                const teamMemberDocRef = doc(firestore, 'agencies', profile.agency_id, 'teamMembers', newUser.uid);
                batch.set(teamMemberDocRef, {
                    id: newUser.uid,
                    user_id: newUser.uid,
                    name: values.name,
                    email: values.email,
                    role: 'Video Recorder',
                    status: 'Active',
                    agency_id: profile.agency_id,
                    agency_name: profile.agencyName,
                    joinedAt: serverTimestamp()
                });
                await batch.commit();
                
                // IMPORTANT: We need to sign the admin back in.
                // This is a limitation of client-side user creation.
                // The user needs to be aware of this.
                await auth.signOut(); // Sign out the newly created user
                toast({ title: "Action Required", description: "Video Recorder created. Please log in again." });
                window.location.href = '/login'; // Force re-login
                return;

            } else {
                // Invitation flow for Agent/Admin
                const batch = writeBatch(firestore);
                const newMemberRef = doc(teamMembersCollectionRef);
                batch.set(newMemberRef, {
                    id: newMemberRef.id,
                    name: values.name,
                    email: values.email,
                    role: values.role,
                    status: 'Pending',
                    agency_id: profile.agency_id,
                    agency_name: profile.agencyName,
                    invitedAt: serverTimestamp()
                });
                const invitationId = `${values.email}_${profile.agency_id}`;
                const invitationRef = doc(firestore, 'invitations', invitationId);
                batch.set(invitationRef, {
                    toEmail: values.email,
                    fromAgencyId: profile.agency_id,
                    fromAgencyName: profile.agencyName,
                    status: 'pending',
                    role: values.role,
                    invitedAt: serverTimestamp(),
                    memberDocId: newMemberRef.id
                });
                await batch.commit();

                toast({ 
                    title: 'Invitation Sent!', 
                    description: `An invitation has been sent to ${values.email}. They will appear as 'Active' once they sign up.` 
                });
            }
        }
        setDialogOpen(false);
    } catch (error: any) {
        console.error("Error saving member:", error);
        let errorMessage = 'Could not save the team member. Please try again.';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email is already registered. Please use another email.';
        }
        toast({
            title: 'An Error Occurred',
            description: errorMessage,
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
              <FormLabel>Member's Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Ahmed Khan" />
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
              <FormLabel>Member's Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} placeholder="member@example.com" disabled={!!memberToEdit} />
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
        {watchedRole === 'Video Recorder' && !memberToEdit && (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Set Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} placeholder="Min. 6 characters" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        )}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" className="glowing-btn" disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin" />}
            {memberToEdit ? 'Save Changes' : (watchedRole === 'Video Recorder' ? 'Create Account' : 'Invite Member')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
