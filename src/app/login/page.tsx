
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
import { Checkbox } from '@/components/ui/checkbox';
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
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ProfileProvider } from '@/context/profile-context';
import { Separator } from '@/components/ui/separator';
import { doc, getDoc } from 'firebase/firestore';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email.'),
  password: z.string().min(1, 'Password is required.'),
  remember: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof formSchema>;

function LoginPageContent() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      if (!auth) {
        throw new Error('Auth service is not available.');
      }
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push('/overview');
    } catch (error: any) {
      console.error('Login Error:', error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description:
          error.code === 'auth/invalid-credential'
            ? 'Incorrect email or password.'
            : 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      if (!auth || !firestore) {
        throw new Error('Auth service is not available.');
      }
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // After successful sign-in, check if user exists in our Firestore 'users' collection
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        // User exists, proceed to dashboard
        router.push('/overview');
      } else {
        // User does not exist in our DB, sign them out and show an error
        await signOut(auth);
        toast({
          variant: 'destructive',
          title: 'Account Not Found',
          description: "Your account does not exist. Please sign up first.",
        });
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      // Don't sign out here, as the initial popup might have been closed by the user
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: 'Could not sign in with Google. Please try again or sign up.',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-violet-100 via-white to-blue-100 dark:from-slate-900 dark:via-slate-800 dark:to-violet-900 p-4 font-body">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="flex justify-center items-center gap-3 mb-4">
            
            <h1 className="text-3xl font-extrabold text-foreground font-headline tracking-tight">
              Signature Property CRM
            </h1>
          </div>
          <p className="text-muted-foreground">
            Welcome back! Please sign in to continue.
          </p>
        </div>

        <Card className="glass-card shadow-2xl hover:shadow-primary/20">
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11"
                  onClick={handleGoogleSignIn}
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
                  Sign in with Google
                </Button>

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                </div>

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

                <div className="flex items-center justify-between text-sm">
                  <FormField
                    control={form.control}
                    name="remember"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <Label className="font-normal">Remember me</Label>
                      </FormItem>
                    )}
                  />
                  <Link
                    href="#"
                    className="font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold mt-4 glowing-btn"
                  disabled={isLoading || isGoogleLoading}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Login
                </Button>
                <div className="mt-4 text-center text-sm">
                  Don&apos;t have an agency account?{' '}
                  <Link
                    href="/signup"
                    className="font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    Create an Account
                  </Link>
                </div>
                 <div className="mt-2 text-center text-sm">
                  Don&apos;t have an agent account?{' '}
                  <Link
                    href="/agent/signup"
                    className="font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    Create an Account
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

export default function LoginPage() {
    return (
        <FirebaseClientProvider>
          <ProfileProvider>
            <LoginPageContent />
          </ProfileProvider>
        </FirebaseClientProvider>
    );
}

    
