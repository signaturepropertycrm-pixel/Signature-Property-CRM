

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Home, Loader2, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { useAuth, useFirestore } from '@/firebase/provider';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, writeBatch, getDoc } from 'firebase/firestore';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ProfileProvider, useProfile } from '@/context/profile-context';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  name: z.string().min(1, 'Your name is required.'),
  agencyName: z.string().min(1, 'Agency name is required.'),
  email: z.string().email('Please enter a valid email.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type SignupFormValues = z.infer<typeof formSchema>;

function SignupPageContent() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { setProfile } = useProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAgencyName, setShowAgencyName] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      agencyName: '',
      email: '',
      password: '',
    },
  });

  const handleGoogleSignUp = async () => {
      setIsGoogleLoading(true);
      try {
          if (!auth || !firestore) {
              throw new Error('Auth or Firestore service is not available.');
          }
          const provider = new GoogleAuthProvider();
          const result = await signInWithPopup(auth, provider);
          const user = result.user;
          const additionalInfo = getAdditionalUserInfo(result);

          if (additionalInfo?.isNewUser) {
              const agencyId = user.uid;
              const batch = writeBatch(firestore);

              const userDocRef = doc(firestore, 'users', user.uid);
              batch.set(userDocRef, {
                  id: user.uid,
                  name: user.displayName,
                  email: user.email,
                  role: 'Admin',
                  agency_id: agencyId,
                  createdAt: serverTimestamp(),
              });

              const agencyDocRef = doc(firestore, 'agencies', agencyId);
              batch.set(agencyDocRef, {
                  id: agencyId,
                  agencyName: `${user.displayName}'s Agency`,
                  ownerId: user.uid,
                  name: user.displayName,
                  createdAt: serverTimestamp(),
                  avatar: user.photoURL,
                  planName: 'Basic', // Add default plan
              });

              const teamMemberRef = doc(firestore, 'agencies', agencyId, 'teamMembers', user.uid);
              batch.set(teamMemberRef, {
                  id: user.uid,
                  name: user.displayName,
                  email: user.email,
                  role: 'Admin',
                  status: 'Active',
                  createdAt: serverTimestamp(),
                  avatar: user.photoURL,
              });

              await batch.commit();

              const newProfileData = {
                  id: user.uid,
                  name: user.displayName || '',
                  agencyName: `${user.displayName}'s Agency`,
                  email: user.email || '',
                  phone: '',
                  role: 'Admin' as const,
                  agency_id: agencyId,
                  user_id: user.uid,
                  avatar: user.photoURL || '',
                  planName: 'Basic' as const,
              };
              setProfile(newProfileData);
          } else {
            // Existing user, just fetch their profile
            const userDocRef = doc(firestore, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                // Profile will be loaded by the main layout's context provider
            }
          }

          toast({
              title: 'Successfully Signed In!',
              description: additionalInfo?.isNewUser ? 'Your new agency account has been created.' : 'Welcome back!',
          });
          router.push('/overview');

      } catch (error: any) {
          console.error('Google Sign-Up Error:', error);
          toast({
              variant: 'destructive',
              title: 'Google Sign-Up Failed',
              description: 'Could not sign up with Google. Please try again.',
          });
      } finally {
          setIsGoogleLoading(false);
      }
  };

  const onSubmit = async (values: SignupFormValues) => {
    setIsLoading(true);
    try {
      if (!auth || !firestore) {
        throw new Error('Auth or Firestore service is not available.');
      }
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      
      const user = userCredential.user;
      if (user) {
        await updateProfile(user, { displayName: values.name });

        const agencyId = user.uid; // The Admin's UID is the agency ID
        
        const newProfileData = {
            id: user.uid,
            name: values.name,
            agencyName: values.agencyName,
            email: values.email,
            phone: '',
            role: 'Admin' as const, 
            agency_id: agencyId,
            user_id: user.uid,
            avatar: '',
            planName: 'Basic' as const,
        };
        
        const batch = writeBatch(firestore);

        // 1. Create the user's main document with all profile info
        const userDocRef = doc(firestore, 'users', user.uid);
        batch.set(userDocRef, {
             id: user.uid,
             name: values.name,
             email: values.email,
             role: 'Admin',
             agency_id: agencyId, // Critical: user belongs to their own agency
             createdAt: serverTimestamp(),
        });
        
        // 2. Create the agency document, owned by this user
        const agencyDocRef = doc(firestore, 'agencies', agencyId);
        batch.set(agencyDocRef, {
            id: agencyId,
            agencyName: values.agencyName, // Corrected field
            ownerId: user.uid,
            name: values.name, // Storing the owner's name directly in the agency doc
            createdAt: serverTimestamp(),
            planName: 'Basic', // Add default plan
        });

        // 3. Add the admin as a team member of their own agency
        const teamMemberRef = doc(firestore, 'agencies', agencyId, 'teamMembers', user.uid);
        batch.set(teamMemberRef, {
            id: user.uid,
            name: values.name,
            email: values.email,
            role: 'Admin',
            status: 'Active',
            createdAt: serverTimestamp(),
        });
        
        await batch.commit();

        await sendEmailVerification(user);

        // Immediately set the profile in the context to avoid stale data issues
        setProfile(newProfileData);
      }

      toast({
        title: 'Account Created!',
        description: 'A verification email has been sent. Please verify your email to continue.',
      });
      router.push('/overview');

    } catch (error: any) {
      console.error('Signup Error:', error);
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description:
          error.code === 'auth/email-already-in-use'
            ? 'This email address is already in use.'
            : 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-violet-100 via-white to-blue-100 dark:from-slate-900 dark:via-slate-800 dark:to-violet-900 p-4 font-body">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="flex justify-center items-center gap-3 mb-4">
            
            <h1 className="text-3xl font-extrabold text-foreground font-headline tracking-tight">
              Asaan Estate
            </h1>
          </div>
          <p className="text-muted-foreground">
            Create an account to get started with your agency.
          </p>
        </div>

        <Card className="glass-card shadow-2xl hover:shadow-primary/20">
          <CardHeader>
            <CardTitle>Create Agency Account</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11"
                  onClick={handleGoogleSignUp}
                  disabled={isGoogleLoading || isLoading}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <svg
                      className="mr-2 h-4 w-4"
                      aria-hidden="true"
                      focusable="false"
                      data-prefix="fab"
                      data-icon="google"
                      role="img"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 488 512"
                    >
                      <path
                        fill="currentColor"
                        d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 400.2 0 264.8S111.8 17.6 244 17.6c78.2 0 128.8 30.7 172.4 69.3l-59.8 58.6C324.2 119.8 291.6 98.4 244 98.4c-83.8 0-146.4 65.5-146.4 166.4s62.6 166.4 146.4 166.4c97.2 0 130.3-72.8 134.7-109.8H244v-73.4h239.3c5.1 26.6 7.7 54.5 7.7 85.4z"
                      ></path>
                    </svg>
                  )}
                  Sign up with Google
                </Button>

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                    </div>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Your Name</Label>
                      <FormControl>
                        <Input
                          placeholder="e.g. Ali Khan"
                          className="bg-input/80"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="agencyName"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Agency Name</Label>
                      <FormControl>
                        <Input
                          placeholder="e.g. Asaan Estate Properties"
                          className="bg-input/80"
                          {...field}
                        />
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
                      <Label>Email</Label>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="m@example.com"
                          className="bg-input/80"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Password</Label>
                       <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            className="bg-input/80 pr-10"
                            {...field}
                            placeholder="••••••••"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff /> : <Eye />}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold mt-4 glowing-btn"
                  disabled={isLoading || isGoogleLoading}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Account
                </Button>
                <div className="mt-4 text-center text-sm">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    Login
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SignupPage() {
    return (
        <FirebaseClientProvider>
          <ProfileProvider>
            <SignupPageContent />
          </ProfileProvider>
        </FirebaseClientProvider>
    );
}

    

    

    