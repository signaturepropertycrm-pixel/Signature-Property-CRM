
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { useAuth } from '@/firebase/provider';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ResetAccountDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const formSchema = z.object({
  password: z.string().min(1, 'Password is required to confirm.'),
});

type ResetFormValues = z.infer<typeof formSchema>;

export function ResetAccountDialog({
  isOpen,
  setIsOpen,
}: ResetAccountDialogProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<ResetFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: '' },
  });

  const handleReset = () => {
    // Clear all relevant localStorage keys
    localStorage.removeItem('properties');
    localStorage.removeItem('buyers');
    localStorage.removeItem('appointments');
    localStorage.removeItem('followUps');
    localStorage.removeItem('teamMembers');
    localStorage.removeItem('activities');
    // We keep app-profile and app-currency as they are user preferences
    
    toast({
      title: 'Account Reset Successful',
      description: 'All your CRM data has been permanently deleted.',
    });

    // Reload the page to reflect the cleared state
    window.location.reload();
  };

  const onSubmit = async (data: ResetFormValues) => {
    if (!user || !user.email) {
        setError('Could not verify user. Please try logging in again.');
        return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
        const credential = EmailAuthProvider.credential(user.email, data.password);
        await reauthenticateWithCredential(user, credential);
        
        // Re-authentication successful, proceed with reset
        handleReset();

    } catch (error: any) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
            setError('Incorrect password. Please try again.');
        } else {
            setError('An unexpected error occurred during authentication.');
            console.error(error);
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-destructive">Reset Your Account</DialogTitle>
          <DialogDescription>
            This is a permanent action. Please confirm by entering your password.
          </DialogDescription>
        </DialogHeader>
        
        <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
                You are about to delete all CRM data, including properties, buyers, and appointments. This action cannot be undone.
            </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} placeholder="Enter your password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm & Reset Account
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
