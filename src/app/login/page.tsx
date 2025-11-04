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
import { Home } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export default function LoginPage() {
  const router = useRouter();

  const handleDemoLogin = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-violet-100 via-white to-blue-100 dark:from-slate-900 dark:via-slate-800 dark:to-violet-900 p-4 font-body">
      <div className="w-full max-w-sm space-y-6 page-transition">
        <div className="text-center">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Home className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-extrabold text-foreground font-headline tracking-tight">
              Signature Property CRM
            </h1>
          </div>
          <p className="text-muted-foreground">Welcome back! Please sign in to continue.</p>
        </div>
        
        <Card className="glass-card shadow-2xl hover:shadow-primary/20">
          <CardHeader>
            <CardTitle>
              Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  defaultValue="demo_admin@signaturecrm.test"
                  className="bg-input/80"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required defaultValue="DemoAdmin123" className="bg-input/80" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" />
                  <Label htmlFor="remember">Remember me</Label>
                </div>
                <Link
                  href="#"
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              <Button onClick={handleDemoLogin} type="submit" className="w-full h-12 text-base font-bold mt-4 glowing-btn">
                Login
              </Button>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{' '}
                <Link href="#" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                  Create an Account
                </Link>
              </div>
            </form>
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
            <Button variant="outline" onClick={handleDemoLogin} className="glass-card hover:bg-accent">Admin</Button>
            <Button variant="outline" onClick={handleDemoLogin} className="glass-card hover:bg-accent">Agent</Button>
            <Button variant="outline" onClick={handleDemoLogin} className="glass-card hover:bg-accent">Viewer</Button>
          </div>
      </div>
    </div>
  );
}
