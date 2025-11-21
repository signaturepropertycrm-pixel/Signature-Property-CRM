
'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
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
import { Bell, ChevronDown, LogOut, Moon, Search, Settings, Sun, User, MessageSquare, Check, X, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Input } from '../ui/input';
import { useProfile } from '@/context/profile-context';
import { useAuth, useFirestore } from '@/firebase/provider';
import { useUser } from '@/firebase/auth/use-user';
import { signOut } from 'firebase/auth';
import { useInvitations } from '@/hooks/use-invitations';
import { doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';

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
  const firestore = useFirestore();
  const { toast } = useToast();
  const { setTheme, theme } = useTheme();
  const { profile } = useProfile();
  const auth = useAuth();
  const { user } = useUser();
  const { invitations, isLoading: areInvitesLoading } = useInvitations(user?.email);
  const [updatingInvite, setUpdatingInvite] = useState<string | null>(null);
  const [actionedInvitations, setActionedInvitations] = useState<Record<string, 'accepted' | 'rejected'>>({});

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

  const handleAccept = (invitationId: string, agencyId: string) => {
    if (!user) return;
    setUpdatingInvite(invitationId);
    
    const batch = writeBatch(firestore);

    // 1. Update the team member document in the agency
    const invRef = doc(firestore, 'agencies', agencyId, 'teamMembers', invitationId);
    batch.update(invRef, { status: 'Active', id: user.uid });

    // 2. Update the agent's main user document to include the agency_id
    const userRef = doc(firestore, 'users', user.uid);
    batch.update(userRef, { agency_id: agencyId });

    batch.commit()
      .then(() => {
        toast({ title: 'Invitation Accepted!', description: 'You have joined the agency.' });
        setActionedInvitations(prev => ({...prev, [invitationId]: 'accepted'}));
        // Optional: Force a profile reload or page refresh
        window.location.reload();
      })
      .catch((error) => {
        const contextualError = new FirestorePermissionError({
          operation: 'write',
          path: `batch write for ${invRef.path} and ${userRef.path}`,
        });
        errorEmitter.emit('permission-error', contextualError);
      })
      .finally(() => {
        setUpdatingInvite(null);
      });
  };

  const handleReject = (invitationId: string, agencyId: string) => {
    setUpdatingInvite(invitationId);
    const invRef = doc(firestore, 'agencies', agencyId, 'teamMembers', invitationId);

    deleteDoc(invRef)
      .then(() => {
        toast({ title: 'Invitation Rejected' });
        setActionedInvitations(prev => ({...prev, [invitationId]: 'rejected'}));
      })
      .catch((error) => {
        const contextualError = new FirestorePermissionError({
          operation: 'delete',
          path: invRef.path,
        });
        errorEmitter.emit('permission-error', contextualError);
      })
      .finally(() => {
        setUpdatingInvite(null);
      });
  };


  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card/80 backdrop-blur-md px-4 sm:px-6">
      <SidebarTrigger className="md:hidden" />
      
      <div className="flex-1 hidden md:block">
        <h1 className="text-xl font-bold text-foreground font-headline">Hello, {firstName}</h1>
        <p className="text-muted-foreground text-sm">Welcome back!</p>
      </div>

      <div className="flex flex-1 md:flex-initial items-center gap-2 justify-end">
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
                    {invitations && invitations.length > 0 && (
                        <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
                    )}
                    <span className="sr-only">Invitations</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card w-80">
                <DropdownMenuLabel>Pending Invitations</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {areInvitesLoading ? (
                     <DropdownMenuItem disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                    </DropdownMenuItem>
                ) : invitations && invitations.length > 0 ? (
                    invitations.map(invite => {
                        const actionTaken = actionedInvitations[invite.id];
                        return (
                         <DropdownMenuItem key={invite.id} className={cn("flex justify-between items-center", actionTaken && "opacity-50")} onSelect={(e) => e.preventDefault()} disabled={!!actionTaken}>
                            <div>
                                <p className="font-semibold">{invite.agency_name}</p>
                                <p className="text-xs text-muted-foreground">wants to add you as an {invite.role}</p>
                            </div>
                            <div className="flex items-center gap-1 w-20 justify-end">
                                {updatingInvite === invite.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 
                                 actionTaken ? (
                                    <span className={cn("text-xs font-semibold", actionTaken === 'accepted' ? 'text-green-600' : 'text-red-600')}>
                                      {actionTaken === 'accepted' ? 'Accepted' : 'Rejected'}
                                    </span>
                                 ) : (
                                    <>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-500 hover:bg-red-500/10" onClick={() => handleReject(invite.id, invite.agency_id)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-500 hover:text-green-500 hover:bg-green-500/10" onClick={() => handleAccept(invite.id, invite.agency_id)}>
                                            <Check className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </DropdownMenuItem>
                        )
                    })
                ) : (
                    <DropdownMenuItem disabled>No pending invitations</DropdownMenuItem>
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
            <DropdownMenuItem onClick={() => router.push('/settings')}>
                <User />
                Profile
            </DropdownMenuItem>
            {(profile.role === 'Admin') && (
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
