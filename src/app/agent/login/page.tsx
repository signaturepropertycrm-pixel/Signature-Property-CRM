
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
import { redirect } from 'next/navigation';

export default function AgentLoginPage() {
    redirect('/login');
    return null;
}
