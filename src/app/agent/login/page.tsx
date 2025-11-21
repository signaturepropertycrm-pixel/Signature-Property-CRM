
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
import { Home, Loader2, Eye, EyeOff, User } from 'lucide-react';
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
import { useAuth } from '@/firebase/provider';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ProfileProvider } from '@/context/profile-context';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email.'),
  password: z.string().min(1, 'Password is required.'),
  remember: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof formSchema>;

function AgentLoginPageContent() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
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
      // This will log the user in. The AuthGuard and ProfileProvider will handle role checks and redirection.
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push('/dashboard');
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

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-emerald-100 via-white to-teal-100 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-900 p-4 font-body">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="flex justify-center items-center gap-3 mb-4">
            <User className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-extrabold text-foreground font-headline tracking-tight">
              Agent Portal
            </h1>
          </div>
          <p className="text-muted-foreground">
            Sign in to your personal agent account.
          </p>
        </div>

        <Card className="glass-card shadow-2xl hover:shadow-primary/20">
          <CardHeader>
            <CardTitle>Agent Login</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Email</Label>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="agent@example.com"
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
                  disabled={isLoading}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Login
                </Button>
                 <div className="mt-4 text-center text-sm">
                  Don&apos;t have an agent account?{' '}
                  <Link
                    href="/agent/signup"
                    className="font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    Create an Account
                  </Link>
                </div>
                 <div className="mt-2 text-center text-sm">
                  Are you an Agency Admin?{' '}
                  <Link
                    href="/login"
                    className="font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    Login here
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

export default function AgentLoginPage() {
    return (
        <FirebaseClientProvider>
          <ProfileProvider>
            <AgentLoginPageContent />
          </ProfileProvider>
        </FirebaseClientProvider>
    );
}
