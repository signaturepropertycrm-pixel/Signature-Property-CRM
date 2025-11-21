
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrency } from '@/context/currency-context';
import type { Currency } from '@/context/currency-context';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useProfile } from '@/context/profile-context';
import React, { useState, useEffect, useRef } from 'react';
import type { ProfileData } from '@/context/profile-context';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import Image from 'next/image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Download, Upload, Server, Eye, EyeOff, AlertTriangle, Loader2 } from 'lucide-react';
import { ResetAccountDialog } from '@/components/reset-account-dialog';
import { useFirestore, useAuth } from '@/firebase/provider';
import { useUser } from '@/firebase/auth/use-user';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, getDocs, writeBatch, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/hooks';
import { EmailAuthProvider, reauthenticateWithCredential, deleteUser, updatePassword, updateProfile } from 'firebase/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';


const passwordFormSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters.'),
    confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match",
    path: ['confirmPassword']
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;


export default function SettingsPage() {
  const { currency, setCurrency } = useCurrency();
  const { profile, setProfile, isLoading: isProfileLoading } = useProfile();
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [localProfile, setLocalProfile] = useState<ProfileData>(profile);
  const [mounted, setMounted] = useState(false);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isDeleteAgentDialogOpen, setDeleteAgentDialogOpen] = useState(false);
  const [isDeleteAgencyDialogOpen, setDeleteAgencyDialogOpen] = useState(false);
  
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);


  const passwordForm = useForm<PasswordFormValues>({
      resolver: zodResolver(passwordFormSchema),
      defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' }
  });

  const agencyPropertiesQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'properties') : null, [profile.agency_id, firestore]);
  const { data: agencyProperties } = useCollection(agencyPropertiesQuery);

  const agencyBuyersQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'buyers') : null, [profile.agency_id, firestore]);
  const { data: agencyBuyers } = useCollection(agencyBuyersQuery);

  const agencyAppointmentsQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'appointments') : null, [profile.agency_id, firestore]);
  const { data: agencyAppointments } = useCollection(agencyAppointmentsQuery);

  const agencyFollowUpsQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'followUps') : null, [profile.agency_id, firestore]);
  const { data: agencyFollowUps } = useCollection(agencyFollowUpsQuery);

  const agencyTeamMembersQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'teamMembers') : null, [profile.agency_id, firestore]);
  const { data: agencyTeamMembers } = useCollection(agencyTeamMembersQuery);

  useEffect(() => {
    setMounted(true);
    setLocalProfile(profile);
  }, [profile]);


  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target;
      setLocalProfile(prev => ({ ...prev, [id]: value }));
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const collectionName = profile.role === 'Admin' ? 'agencies' : 'agents';
    const docId = profile.role === 'Admin' ? profile.agency_id : user.uid;

    if (!docId) {
        toast({ title: 'Error updating profile', description: 'Could not determine document to update.', variant: 'destructive'});
        return;
    }

    const docRef = doc(firestore, collectionName, docId);
    
    let dataToUpdate: Partial<ProfileData> = {};
    if (profile.role === 'Admin') {
        dataToUpdate = { agencyName: localProfile.agencyName, name: localProfile.name };
    } else {
        dataToUpdate = { name: localProfile.name };
    }

    await updateDoc(docRef, dataToUpdate);

    // Also update the display name in Firebase Auth itself
    if (auth.currentUser && localProfile.name) {
      await updateProfile(auth.currentUser, { displayName: localProfile.name });
    }

    setProfile(localProfile);
    toast({
      title: 'Profile Updated',
      description: 'Your profile information has been saved successfully.',
    });
  };

  const handlePasswordChange = async (values: PasswordFormValues) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
        toast({ title: "Error", description: "Not logged in or email not found.", variant: "destructive" });
        return;
    }
    
    setIsPasswordUpdating(true);
    const credential = EmailAuthProvider.credential(currentUser.email, values.currentPassword);
    
    try {
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, values.newPassword);
        toast({
            title: 'Password Updated',
            description: 'Your password has been changed successfully.',
        });
        passwordForm.reset();
    } catch (error: any) {
        console.error("Password change error:", error);
        toast({
            variant: 'destructive',
            title: 'Password Change Failed',
            description: error.code === 'auth/invalid-credential' ? 'Incorrect current password.' : 'An error occurred. Please try again.',
        });
    } finally {
        setIsPasswordUpdating(false);
    }
  };

  const handleAvatarSave = async (dataUrl: string) => {
    if (!user) return;
        
    const collectionName = profile.role === 'Admin' ? 'agencies' : 'agents';
    const docId = profile.role === 'Admin' ? profile.agency_id : user.uid;
    if (!docId) return;

    const docRef = doc(firestore, collectionName, docId);
    await updateDoc(docRef, { avatar: dataUrl });
    
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { photoURL: dataUrl });
    }

    setProfile({ ...profile, avatar: dataUrl });
    toast({
        title: "Profile Picture Updated",
        description: "Your new avatar has been saved."
    });
    setIsAvatarDialogOpen(false);
  }

  const handleBackup = () => {
    try {
        const dataToBackup = profile.role === 'Admin' ? {
            agencyProperties: agencyProperties || [],
            agencyBuyers: agencyBuyers || [],
            agencyAppointments: agencyAppointments || [],
            agencyFollowUps: agencyFollowUps || [],
            agencyTeamMembers: agencyTeamMembers || [],
            profile: profile || {},
        } : {
            profile: profile || {},
        }

        const blob = new Blob([JSON.stringify(dataToBackup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().split('T')[0];
        a.download = `signaturecrm-backup-${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
            title: "Backup Successful",
            description: "Your data has been downloaded."
        });

    } catch (error) {
        console.error("Backup failed:", error);
        toast({
            title: "Backup Failed",
            description: "Could not create a backup. Please check console for errors.",
            variant: "destructive",
        });
    }
  };

  const handleRestore = () => {
    if (!restoreFile || !profile.agency_id) {
      toast({ title: 'No file or user session', variant: 'destructive' });
      return;
    }
  };
  
    const handleDeleteAgentAccount = async (password: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) return;

    const credential = EmailAuthProvider.credential(currentUser.email, password);
    try {
        await reauthenticateWithCredential(currentUser, credential);
        const batch = writeBatch(firestore);
        
        const agentDoc = doc(firestore, 'agents', currentUser.uid);
        batch.delete(agentDoc);

        const userDoc = doc(firestore, 'users', currentUser.uid);
        batch.delete(userDoc);
        
        if (profile.agency_id) {
            const teamMemberDoc = doc(firestore, 'agencies', profile.agency_id, 'teamMembers', currentUser.uid);
            batch.delete(teamMemberDoc);
        }

        await batch.commit();
        await deleteUser(currentUser);
        
        toast({ title: "Account Deleted", description: "Your agent account has been permanently deleted." });
        window.location.href = '/login';
        
    } catch (error: any) {
        console.error("Agent account deletion error:", error);
        toast({ title: 'Deletion Failed', description: error.code === 'auth/invalid-credential' ? 'Incorrect password.' : 'An error occurred.', variant: 'destructive' });
        throw error;
    }
  };

  const handleDeleteAgencyAccount = async (password: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email || !profile.agency_id) return;

    const credential = EmailAuthProvider.credential(currentUser.email, password);
    try {
        await reauthenticateWithCredential(currentUser, credential);
        
        const batch = writeBatch(firestore);
        const agencyId = profile.agency_id;
        
        const subCollections = ['properties', 'buyers', 'teamMembers', 'appointments', 'followUps', 'activityLogs'];
        for (const subCol of subCollections) {
            const querySnapshot = await getDocs(collection(firestore, 'agencies', agencyId, subCol));
            querySnapshot.forEach(doc => batch.delete(doc.ref));
        }

        const agencyDocRef = doc(firestore, 'agencies', agencyId);
        batch.delete(agencyDocRef);

        const userDocRef = doc(firestore, 'users', currentUser.uid);
        batch.delete(userDocRef);

        await batch.commit();

        await deleteUser(currentUser);
        
        toast({ title: "Agency Account Deleted", description: "Your agency and all its data have been permanently deleted." });
        window.location.href = '/login';
        
    } catch (error: any) {
        console.error("Agency account deletion error:", error);
        toast({ title: 'Deletion Failed', description: error.code === 'auth/invalid-credential' ? 'Incorrect password.' : 'An error occurred while deleting data.', variant: 'destructive' });
        throw error;
    }
  };


  if (!mounted || isProfileLoading) {
    return null;
  }

  if (profile.role === 'Agent') {
      return (
          <>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Agent Settings</h1>
                    <p className="text-muted-foreground">Manage your personal profile and account settings.</p>
                </div>
                <Card>
                    <CardHeader><CardTitle>My Profile</CardTitle></CardHeader>
                    <form onSubmit={handleProfileSave}>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-6">
                                <Avatar className="h-20 w-20 border-4 border-primary/20">
                                    <AvatarImage src={profile.avatar} />
                                    <AvatarFallback>{profile.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-lg font-bold">{profile.name}</h3>
                                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setIsAvatarDialogOpen(true)}>Change Picture</Button>
                                </div>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Your Name</Label>
                                    <Input id="name" value={localProfile.name || ''} onChange={handleProfileChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Account Email</Label>
                                    <Input id="email" type="email" value={user?.email || ''} disabled className="cursor-not-allowed bg-muted/50" />
                                </div>
                            </div>
                        </CardContent>
                         <CardFooter className="border-t px-6 py-4"><Button>Save Changes</Button></CardFooter>
                    </form>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Security</CardTitle><CardDescription>Change your password.</CardDescription></CardHeader>
                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)}>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={passwordForm.control}
                                    name="currentPassword"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Current Password</FormLabel>
                                        <div className="relative">
                                        <FormControl>
                                            <Input type={showCurrentPassword ? 'text' : 'password'} {...field} className="pr-10" />
                                        </FormControl>
                                        <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>{showCurrentPassword ? <EyeOff /> : <Eye />}</Button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <FormField
                                        control={passwordForm.control}
                                        name="newPassword"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>New Password</FormLabel>
                                            <div className="relative">
                                            <FormControl>
                                                <Input type={showNewPassword ? 'text' : 'password'} {...field} className="pr-10" />
                                            </FormControl>
                                            <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground" onClick={() => setShowNewPassword(!showNewPassword)}>{showNewPassword ? <EyeOff /> : <Eye />}</Button>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={passwordForm.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm New Password</FormLabel>
                                            <div className="relative">
                                            <FormControl>
                                                <Input type={showConfirmPassword ? 'text' : 'password'} {...field} className="pr-10" />
                                            </FormControl>
                                            <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff /> : <Eye />}</Button>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="border-t px-6 py-4">
                                <Button type="submit" disabled={isPasswordUpdating}>
                                    {isPasswordUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Password
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>
                 <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle /> Danger Zone</CardTitle>
                        <CardDescription>This action is irreversible. Please proceed with caution.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg bg-destructive/10">
                            <div>
                                <h3 className="font-bold">Delete Account</h3>
                                <p className="text-sm text-destructive/80">Permanently delete your agent account and all related personal data.</p>
                            </div>
                            <Button variant="destructive" className="mt-2 sm:mt-0" onClick={() => setDeleteAgentDialogOpen(true)}>Delete My Account</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <SimpleAvatarDialog 
              isOpen={isAvatarDialogOpen}
              setIsOpen={setIsAvatarDialogOpen}
              onSave={handleAvatarSave}
            />
            <DeleteAgentDialog 
                isOpen={isDeleteAgentDialogOpen}
                setIsOpen={setDeleteAgentDialogOpen}
                onConfirm={handleDeleteAgentAccount}
            />
          </>
      );
  }

  return (
    <>
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account, profile, and app settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your agency and personal details here.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleProfileSave}>
          <CardContent className="space-y-6">
             <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 border-4 border-primary/20">
                    <AvatarImage src={profile.avatar} />
                    <AvatarFallback>{profile.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="text-lg font-bold">{profile.name}</h3>
                    <p className="text-sm text-muted-foreground">{profile.agencyName}</p>
                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setIsAvatarDialogOpen(true)}>
                        Change Picture
                    </Button>
                </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="agencyName">Agency Name</Label>
                <Input
                  id="agencyName"
                  value={localProfile.agencyName || ''}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input id="name" value={localProfile.name || ''} onChange={handleProfileChange} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={localProfile.phone || ''} onChange={handleProfileChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Account Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="cursor-not-allowed bg-muted/50"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button>Save Changes</Button>
          </CardFooter>
        </form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Change your password.
          </CardDescription>
        </CardHeader>
        <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)}>
                <CardContent className="space-y-4">
                    <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <div className="relative">
                            <FormControl>
                                <Input type={showCurrentPassword ? 'text' : 'password'} {...field} className="pr-10" />
                            </FormControl>
                            <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>{showCurrentPassword ? <EyeOff /> : <Eye />}</Button>
                            </div>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <div className="relative">
                                <FormControl>
                                    <Input type={showNewPassword ? 'text' : 'password'} {...field} className="pr-10" />
                                </FormControl>
                                <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground" onClick={() => setShowNewPassword(!showNewPassword)}>{showNewPassword ? <EyeOff /> : <Eye />}</Button>
                                </div>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirm New Password</FormLabel>
                                <div className="relative">
                                <FormControl>
                                    <Input type={showConfirmPassword ? 'text' : 'password'} {...field} className="pr-10" />
                                </FormControl>
                                <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff /> : <Eye />}</Button>
                                </div>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button type="submit" disabled={isPasswordUpdating}>
                        {isPasswordUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Password
                    </Button>
                </CardFooter>
            </form>
        </Form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize the look and feel of the application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="space-y-2">
              <Label>Theme</Label>
              <RadioGroup
                value={theme}
                onValueChange={setTheme}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="theme-light" />
                  <Label htmlFor="theme-light">Light</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="theme-dark" />
                  <Label htmlFor="theme-dark">Dark</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="theme-system" />
                  <Label htmlFor="theme-system">System</Label>
                </div>
              </RadioGroup>
            </div>
            <Separator />
            <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-3">
              <Label htmlFor="currency" className="md:col-span-1">
                Currency
              </Label>
              <div className="md:col-span-2">
                <Select
                  value={currency}
                  onValueChange={(value: Currency) => setCurrency(value)}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PKR">PKR - Pakistani Rupee</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-2 text-xs text-muted-foreground">
                  This will change the currency symbol across the app.
                </p>
              </div>
            </div>
            <Separator />
             <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-3">
              <Label htmlFor="language" className="md:col-span-1">
                Language
              </Label>
              <div className="md:col-span-2">
                <Select defaultValue="en-us">
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-us">English (United States)</SelectItem>
                    <SelectItem value="ur-pk" disabled>Urdu (Pakistan)</SelectItem>
                  </SelectContent>
                </Select>
                 <p className="mt-2 text-xs text-muted-foreground">
                  Choose your preferred language for the interface.
                </p>
              </div>
            </div>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Manage how you receive notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                    <Label>Email for new leads</Label>
                    <p className="text-xs text-muted-foreground">Receive an email every time a new buyer is added.</p>
                </div>
                <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                    <Label>Appointment reminders</Label>
                    <p className="text-xs text-muted-foreground">Get an email reminder one hour before an appointment.</p>
                </div>
                <Switch />
            </div>
             <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                    <Label>In-app mentions</Label>
                    <p className="text-xs text-muted-foreground">Get a notification when a team member @-mentions you.</p>
                </div>
                <Switch defaultChecked />
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Server /> Backup &amp; Restore</CardTitle>
            <CardDescription>
                Download a full backup of your data or restore it from a file.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
                <h3 className="font-semibold mb-2">Download Backup</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Download all your properties, buyers, appointments and follow-ups into a single JSON file. Keep it safe!
                </p>
                <Button onClick={handleBackup}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Full Backup
                </Button>
            </div>
            <Separator />
             <div>
                <h3 className="font-semibold mb-2">Restore from Backup</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Restore your data from a previously downloaded backup file. This will overwrite all current data in Firestore.
                </p>
                 <div className="flex flex-col sm:flex-row gap-4">
                    <Input 
                        id="restore-upload"
                        type="file"
                        accept=".json"
                        onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                        className="max-w-xs"
                    />
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="destructive" disabled={!restoreFile}>
                            <Upload className="mr-2 h-4 w-4" />
                            Restore Backup
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. Restoring from a backup will
                            <span className="font-bold text-destructive"> permanently overwrite all existing data </span> 
                            in the application with the data from this file.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleRestore}>
                            Yes, Overwrite and Restore
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </CardContent>
      </Card>

      {profile.role === 'Admin' && (
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle /> Danger Zone</CardTitle>
                <CardDescription>
                    These actions are irreversible. Please proceed with caution.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg bg-destructive/10">
                        <div>
                            <h3 className="font-bold">Reset Account</h3>
                            <p className="text-sm text-destructive/80">Permanently delete all CRM data including properties, buyers, and appointments. Your user account will not be deleted.</p>
                        </div>
                        <Button variant="destructive" className="mt-2 sm:mt-0" onClick={() => setIsResetDialogOpen(true)}>Reset Account</Button>
                    </div>
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg bg-destructive/10">
                        <div>
                            <h3 className="font-bold">Delete Agency Account</h3>
                            <p className="text-sm text-destructive/80">Permanently delete your agency, all CRM data, and your user account.</p>
                        </div>
                        <Button variant="destructive" className="mt-2 sm:mt-0" onClick={() => setDeleteAgencyDialogOpen(true)}>Delete Agency</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
      )}

    </div>
    <SimpleAvatarDialog 
      isOpen={isAvatarDialogOpen}
      setIsOpen={setIsAvatarDialogOpen}
      onSave={handleAvatarSave}
    />

    <ResetAccountDialog isOpen={isResetDialogOpen} setIsOpen={setIsResetDialogOpen} />
    <DeleteAgencyDialog 
        isOpen={isDeleteAgencyDialogOpen}
        setIsOpen={setDeleteAgencyDialogOpen}
        onConfirm={handleDeleteAgencyAccount}
    />
    </>
  );
}


function DeleteAgentDialog({ isOpen, setIsOpen, onConfirm }: { isOpen: boolean, setIsOpen: (open: boolean) => void, onConfirm: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleConfirm = async () => {
    if (!password) {
      setError('Password is required to confirm.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await onConfirm(password);
      setIsOpen(false);
    } catch (e: any) {
       setError(e.message || 'An error occurred during deletion.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete Your Account</DialogTitle>
          <DialogDescription>
            This action is permanent and cannot be undone. To confirm, please enter your password.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
            <Label htmlFor="delete-password">Password</Label>
            <Input 
                id="delete-password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Enter your password"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isLoading}>
            {isLoading && <AlertTriangle className="animate-spin mr-2" />}
            Confirm & Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function DeleteAgencyDialog({ isOpen, setIsOpen, onConfirm }: { isOpen: boolean, setIsOpen: (open: boolean) => void, onConfirm: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleConfirm = async () => {
    if (!password) {
      setError('Password is required to confirm.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await onConfirm(password);
      setIsOpen(false);
    } catch (e: any) {
       setError(e.message || 'An error occurred during deletion.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete Agency Account</DialogTitle>
          <DialogDescription>
            This action will permanently delete your agency, all its data, and your user account. To confirm, please enter your password.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
            <Label htmlFor="delete-agency-password">Password</Label>
            <Input 
                id="delete-agency-password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Enter your password"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin mr-2" />}
            Confirm & Delete Agency
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
    
function SimpleAvatarDialog({
  isOpen,
  setIsOpen,
  onSave,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSave: (dataUrl: string) => void;
}) {
  const [imgSrc, setImgSrc] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setImgSrc('');
      setError('');
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setError('');
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!imgSrc) {
      setError('Please select an image first.');
      return;
    }
    const image = document.createElement('img');
    image.src = imgSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 256;
      const MAX_HEIGHT = 256;
      let width = image.width;
      let height = image.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(image, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Profile Picture</DialogTitle>
          <DialogDescription>Upload a new image for your profile.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            id="avatar-upload"
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          {imgSrc && (
            <div className="flex flex-col items-center gap-4 mt-4">
              <Label>Preview</Label>
              <Avatar className="h-32 w-32 border">
                <AvatarImage src={imgSrc} alt="Preview" />
                <AvatarFallback>IMG</AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!imgSrc || !!error}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
