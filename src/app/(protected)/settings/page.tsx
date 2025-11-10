
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
import React, { useState } from 'react';
import type { ProfileData } from '@/context/profile-context';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';

export default function SettingsPage() {
  const { currency, setCurrency } = useCurrency();
  const { profile, setProfile } = useProfile();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [localProfile, setLocalProfile] = useState<ProfileData>(profile);

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

  return (
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
          <CardContent className="space-y-4">
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
              <Input id="currentPassword" type="password" />
            </div>
             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
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
                defaultValue={theme}
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
    </div>
  );
}
