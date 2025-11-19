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
import { Home, Loader2 } from 'lucide-react';
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
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email.'),
  password: z.string().min(1, 'Password is required.'),
  remember: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isRoleLoading, setIsRoleLoading] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: 'demo_admin@signaturecrm.test',
      password: 'DemoAdmin123',
      remember: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
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
  
  const handleRoleLogin = async (role: 'Admin' | 'Agent' | 'Viewer') => {
      let email = 'demo_admin@signaturecrm.test';
      if (role === 'Agent') email = 'demo_agent@signaturecrm.test';
      if (role === 'Viewer') email = 'demo_viewer@signaturecrm.test';

      setIsRoleLoading(role);
      try {
          await signInWithEmailAndPassword(auth, email, 'DemoAdmin123');
          router.push('/dashboard');
      } catch (error: any) {
           toast({
              variant: 'destructive',
              title: 'Login Failed',
              description: 'Could not log in as ' + role,
           });
      } finally {
          setIsRoleLoading(null);
      }
  }


  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-violet-100 via-white to-blue-100 dark:from-slate-900 dark:via-slate-800 dark:to-violet-900 p-4 font-body">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Home className="h-8 w-8 text-primary" />
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
                      <FormControl>
                        <Input
                          type="password"
                          className="bg-input/80"
                          {...field}
                        />
                      </FormControl>
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
                  disabled={isLoading}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Login
                </Button>
                <div className="mt-4 text-center text-sm">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="#"
                    className="font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    Create an Account
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or login as
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button variant="outline" onClick={() => handleRoleLogin('Admin')} disabled={!!isRoleLoading} className="glass-card hover:bg-accent">
                {isRoleLoading === 'Admin' ? <Loader2 className="animate-spin" /> : 'Admin'}
            </Button>
            <Button variant="outline" onClick={() => handleRoleLogin('Agent')} disabled={!!isRoleLoading} className="glass-card hover:bg-accent">
                {isRoleLoading === 'Agent' ? <Loader2 className="animate-spin" /> : 'Agent'}
            </Button>
            <Button variant="outline" onClick={() => handleRoleLogin('Viewer')} disabled={!!isRoleLoading} className="glass-card hover:bg-accent">
                {isRoleLoading === 'Viewer' ? <Loader2 className="animate-spin" /> : 'Viewer'}
            </Button>
          </div>
      </div>
    </div>
  );
}
