
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
import { doc, setDoc, serverTimestamp, writeBatch, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { useProfile } from '@/context/profile-context';
import { Loader2 } from 'lucide-react';

const roles: UserRole[] = ['Admin', 'Agent'];

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(roles).default('Agent'),
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
      role: 'Agent',
    },
  });

  useEffect(() => {
    if (memberToEdit) {
      form.reset({
        name: memberToEdit.name,
        email: memberToEdit.email,
        role: memberToEdit.role,
      });
    } else {
        form.reset({ name: '', email: '', role: 'Agent' });
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

            const batch = writeBatch(firestore);

            // 1. Create a new document in the agency's subcollection to get its ID
            const newMemberRef = doc(teamMembersCollectionRef);
            batch.set(newMemberRef, {
                id: newMemberRef.id, // Store the ID within the document
                name: values.name,
                email: values.email,
                role: values.role,
                status: 'Pending',
                agency_id: profile.agency_id,
                agency_name: profile.agencyName,
                invitedAt: serverTimestamp()
            });

            // 2. Create the public invitation with the ID of the document from step 1
            const invitationId = `${values.email}_${profile.agency_id}`;
            const invitationRef = doc(firestore, 'invitations', invitationId);
            batch.set(invitationRef, {
                toEmail: values.email,
                fromAgencyId: profile.agency_id,
                fromAgencyName: profile.agencyName,
                status: 'pending',
                role: values.role,
                invitedAt: serverTimestamp(),
                memberDocId: newMemberRef.id // IMPORTANT: Store the reference ID
            });

            await batch.commit();


            toast({ 
                title: 'Invitation Sent!', 
                description: `An invitation has been sent to ${values.email}. They will appear as 'Active' once they sign up.` 
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
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" className="glowing-btn" disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin" />}
            {memberToEdit ? 'Save Changes' : 'Invite Member'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
