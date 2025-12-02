
'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, ChevronDown, LogOut, Moon, Search, Settings, Sun, User, MessageSquare, Check, X, Loader2, Menu, CalendarClock, Phone } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Input } from '../ui/input';
import { useProfile } from '@/context/profile-context';
import { useAuth, useFirestore } from '@/firebase/provider';
import { useUser } from '@/firebase/auth/use-user';
import { signOut } from 'firebase/auth';
import { useNotifications } from '@/hooks/use-notifications';
import { doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatDistanceToNow } from 'date-fns';

const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'invitation':
            return <User className="h-4 w-4 text-blue-500" />;
        case 'appointment':
            return <CalendarClock className="h-4 w-4 text-green-500" />;
        case 'followup':
            return <Phone className="h-4 w-4 text-purple-500" />;
        default:
            return <Bell className="h-4 w-4" />;
    }
};

export function AppHeader({ 
  searchable,
  searchQuery,
  setSearchQuery
}: {
  searchable: boolean;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
}) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { setTheme, theme } = useTheme();
  const { profile } = useProfile();
  const auth = useAuth();
  const { user } = useUser();
  const { toggleSidebar } = useSidebar();
  const { notifications, isLoading: areNotificationsLoading, acceptInvitation, rejectInvitation } = useNotifications();
  const [updatingInvite, setUpdatingInvite] = useState<string | null>(null);

  const displayName = profile.name || 'User';
  const displayImage = profile.avatar || user?.photoURL;
  const firstName = displayName.split(' ')[0];
  
  const handleLogout = async () => {
    if (auth) {
        await signOut(auth);
    }
    localStorage.removeItem('app-profile');
    router.push('/login');
  };

  const handleAccept = async (invitationId: string, agencyId: string) => {
    if (!user) return;
    setUpdatingInvite(invitationId);
    try {
        await acceptInvitation(invitationId, agencyId, user.uid);
        toast({ title: 'Invitation Accepted!', description: 'You have joined the agency.' });
        window.location.reload();
    } catch (error) {
        console.error("Error accepting invitation:", error);
        toast({ title: 'Error', description: 'Could not accept invitation.', variant: 'destructive' });
    } finally {
        setUpdatingInvite(null);
    }
  };

  const handleReject = async (invitationId: string, agencyId: string) => {
    setUpdatingInvite(invitationId);
    try {
        await rejectInvitation(invitationId, agencyId);
        toast({ title: 'Invitation Rejected' });
    } catch (error) {
        console.error("Error rejecting invitation:", error);
        toast({ title: 'Error', description: 'Could not reject invitation.', variant: 'destructive' });
    } finally {
        setUpdatingInvite(null);
    }
  };


  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card/80 backdrop-blur-md px-4 sm:px-6">
      
      {isMobile === false && (
        <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground font-headline">Hello, {firstName}</h1>
            <p className="text-muted-foreground text-sm">Welcome back!</p>
        </div>
      )}

      <div className="flex flex-1 items-center gap-2 justify-end">
        {searchable && (
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="w-full pl-10 rounded-full bg-input/80" 
              value={searchQuery}
              onChange={(e) => setSearchQuery?.(e.target.value)}
            />
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="rounded-full">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full relative">
                    <Bell className="h-5 w-5" />
                    {notifications && notifications.length > 0 && (
                        <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card w-96">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {areNotificationsLoading ? (
                     <DropdownMenuItem disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                    </DropdownMenuItem>
                ) : notifications && notifications.length > 0 ? (
                    notifications.map(notification => (
                         <DropdownMenuItem key={notification.id} className="flex justify-between items-start gap-3" onSelect={(e) => e.preventDefault()}>
                            <div className="flex-shrink-0 pt-1">{getNotificationIcon(notification.type)}</div>
                            <div className="flex-1">
                                <p className="font-semibold">{notification.title}</p>
                                <p className="text-xs text-muted-foreground">{notification.description}</p>
                                <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(notification.timestamp, { addSuffix: true })}</p>
                            </div>
                            {notification.type === 'invitation' && (
                                <div className="flex items-center gap-1 w-20 justify-end">
                                    {updatingInvite === notification.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                        <>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-500 hover:bg-red-500/10" onClick={() => handleReject(notification.id, notification.agencyId)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-green-500 hover:text-green-500 hover:bg-green-500/10" onClick={() => handleAccept(notification.id, notification.agencyId)}>
                                                <Check className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            )}
                        </DropdownMenuItem>
                    ))
                ) : (
                    <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 rounded-full p-1 h-auto">
              <Avatar className="h-9 w-9 border-2 border-primary/50">
                <AvatarImage src={displayImage} alt={displayName} />
                <AvatarFallback>{displayName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline font-semibold">{displayName}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-card">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(profile.role === 'Admin' || profile.role === 'Agent') && (
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings />
                  Settings
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => router.push('/support')}>
                <MessageSquare />
                Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
                <LogOut />
                Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
