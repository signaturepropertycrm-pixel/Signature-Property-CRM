
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
import React, { useState, useEffect } from 'react';
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
import { Download, Upload, Server, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { ResetAccountDialog } from '@/components/reset-account-dialog';


export default function SettingsPage() {
  const { currency, setCurrency } = useCurrency();
  const { profile, setProfile } = useProfile();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [localProfile, setLocalProfile] = useState<ProfileData>(profile);
  const [mounted, setMounted] = useState(false);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
    setLocalProfile(profile);
  }, [profile]);

  useEffect(() => {
    if (!isAvatarDialogOpen) {
      setAvatarPreview(null);
      setAvatarFile(null);
    }
  }, [isAvatarDialogOpen]);


  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target;
      setLocalProfile(prev => ({ ...prev, [id]: value }));
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(localProfile);
    toast({
      title: 'Profile Updated',
      description: 'Your profile information has been saved successfully.',
    });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Password Updated',
      description: 'Your password has been changed successfully.',
    });
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarSave = () => {
    if (avatarPreview) {
      setProfile({ ...profile, avatar: avatarPreview });
      toast({
          title: "Profile Picture Updated",
          description: "Your new avatar has been saved."
      });
      setIsAvatarDialogOpen(false);
    }
  }

  const handleBackup = () => {
    try {
        const backupData = {
            properties: JSON.parse(localStorage.getItem('properties') || '[]'),
            buyers: JSON.parse(localStorage.getItem('buyers') || '[]'),
            appointments: JSON.parse(localStorage.getItem('appointments') || '[]'),
            followUps: JSON.parse(localStorage.getItem('followUps') || '[]'),
            teamMembers: JSON.parse(localStorage.getItem('teamMembers') || '[]'),
            profile: JSON.parse(localStorage.getItem('app-profile') || '{}'),
        };

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
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
    if (!restoreFile) {
      toast({
        title: 'No file selected',
        description: 'Please choose a backup file to restore.',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backupData = JSON.parse(event.target?.result as string);

        // Basic validation
        const requiredKeys = ['properties', 'buyers', 'appointments', 'followUps'];
        const missingKeys = requiredKeys.filter(key => !(key in backupData));
        if (missingKeys.length > 0) {
            throw new Error(`Backup file is missing required data: ${missingKeys.join(', ')}`);
        }
        
        localStorage.setItem('properties', JSON.stringify(backupData.properties || []));
        localStorage.setItem('buyers', JSON.stringify(backupData.buyers || []));
        localStorage.setItem('appointments', JSON.stringify(backupData.appointments || []));
        localStorage.setItem('followUps', JSON.stringify(backupData.followUps || []));
        localStorage.setItem('teamMembers', JSON.stringify(backupData.teamMembers || []));
        localStorage.setItem('app-profile', JSON.stringify(backupData.profile || {}));


        toast({
          title: 'Restore Successful',
          description: 'Your data has been restored. Please reload the page to see the changes.',
        });

      } catch (error: any) {
        console.error('Restore failed:', error);
        toast({
          title: 'Restore Failed',
          description: error.message || 'The backup file is invalid or corrupted.',
          variant: 'destructive',
        });
      } finally {
        setRestoreFile(null);
        // Reset the file input
        const fileInput = document.getElementById('restore-upload') as HTMLInputElement;
        if(fileInput) fileInput.value = '';
      }
    };
    reader.readAsText(restoreFile);
  };
  
  if (!mounted) {
    return null; // or a loading spinner
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
            Update your agency and owner details here.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleProfileSave}>
          <CardContent className="space-y-6">
             <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 border-4 border-primary/20">
                    <AvatarImage src={profile.avatar} />
                    <AvatarFallback>{profile.ownerName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="text-lg font-bold">{profile.ownerName}</h3>
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
                  value={localProfile.agencyName}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerName">Agency Owner Name</Label>
                <Input id="ownerName" value={localProfile.ownerName} onChange={handleProfileChange} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={localProfile.phone} onChange={handleProfileChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Account Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue="demo_admin@signaturecrm.test"
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
        <form onSubmit={handlePasswordChange}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input id="currentPassword" type={showCurrentPassword ? 'text' : 'password'} className="pr-10" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>
             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input id="newPassword" type={showNewPassword ? 'text' : 'password'} className="pr-10" />
                     <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} className="pr-10" />
                     <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button>Update Password</Button>
          </CardFooter>
        </form>
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
                    Restore your data from a previously downloaded backup file. This will overwrite all current data.
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
                            in the application, including properties, buyers, and appointments.
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg bg-destructive/10">
                    <div>
                        <h3 className="font-bold">Reset Account</h3>
                        <p className="text-sm text-destructive/80">Permanently delete all CRM data including properties, buyers, and appointments. Your user account will not be deleted.</p>
                    </div>
                    <Button variant="destructive" className="mt-2 sm:mt-0" onClick={() => setIsResetDialogOpen(true)}>Reset Account</Button>
                </div>
            </CardContent>
        </Card>
      )}

    </div>
    <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Change Profile Picture</DialogTitle>
                <DialogDescription>
                    Upload an image from your computer to update your profile picture.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                {avatarPreview && (
                  <div className="flex justify-center">
                    <Image src={avatarPreview} alt="Avatar preview" width={128} height={128} className="rounded-full aspect-square object-cover" />
                  </div>
                )}
                <div className="grid gap-2">
                    <Label htmlFor="avatar-upload">Choose Image</Label>
                    <Input 
                        id="avatar-upload"
                        type="file"
                        accept="image/png, image/jpeg, image/gif"
                        onChange={handleAvatarFileChange}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsAvatarDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAvatarSave} disabled={!avatarFile}>Save Changes</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <ResetAccountDialog isOpen={isResetDialogOpen} setIsOpen={setIsResetDialogOpen} />
    </>
  );
}
