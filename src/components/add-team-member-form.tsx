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
import { doc, setDoc, serverTimestamp, writeBatch, updateDoc, collection, addDoc } from 'firebase/firestore';
import { useProfile } from '@/context/profile-context';
import { Loader2 } from 'lucide-react';

const roles: UserRole[] = ['Editor', 'Agent'];

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
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
      email: '',
      role: 'Agent',
    },
  });

  useEffect(() => {
    if (memberToEdit) {
      form.reset({
        email: memberToEdit.email,
        role: memberToEdit.role,
      });
    } else {
        form.reset({ email: '', role: 'Agent' });
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
            // This logic is now only for changing the role of an existing member.
            const memberRef = doc(firestore, 'agencies', profile.agency_id, 'teamMembers', memberToEdit.id);
            await updateDoc(memberRef, { role: values.role });
            toast({ title: 'Member Updated', description: `Role has been updated to ${values.role}.` });
        } else {
            // Send an invitation by creating a 'pending' document.
            const teamMemberRef = collection(firestore, 'agencies', profile.agency_id, 'teamMembers');
            await addDoc(teamMemberRef, {
                email: values.email,
                role: values.role,
                status: 'Pending', // New invitation status
                agency_id: profile.agency_id,
                agency_name: profile.agencyName,
                invitedAt: serverTimestamp()
            });

            toast({ 
                title: 'Invitation Sent!', 
                description: `${values.email} has been invited to join your agency as an ${values.role}.` 
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
            {memberToEdit ? 'Save Changes' : 'Send Invite'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
