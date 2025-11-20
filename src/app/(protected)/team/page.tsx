
'use client';
import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, HandCoins, Users, CalendarCheck, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import type { User } from '@/lib/types';
import { TeamMemberDetailsDialog } from '@/components/team-member-details-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddTeamMemberDialog } from '@/components/add-team-member-dialog';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useAuth } from '@/firebase/provider';
import { useUser } from '@/firebase/auth/use-user';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, addDoc, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useProfile } from '@/context/profile-context';
import { useMemoFirebase } from '@/firebase/hooks';

const roleVariant = {
    Admin: 'default',
    Agent: 'secondary',
    Editor: 'outline',
} as const;

const StatItem = ({ icon: Icon, value, label }: { icon: React.ElementType, value: number, label: string }) => (
    <div className="flex flex-col items-center gap-1 text-center">
        <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="font-bold text-lg">{value}</span>
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
    </div>
);


export default function TeamPage() {
    const firestore = useFirestore();
    const auth = useAuth();
    const { user } = useUser();
    const { profile } = useProfile();
    const teamMembersQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'teamMembers') : null, [user, firestore]);
    const { data: teamMembers, isLoading } = useCollection<User>(teamMembersQuery);

    const [selectedMember, setSelectedMember] = useState<User | null>(null);
    const [memberToEdit, setMemberToEdit] = useState<User | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (!isAddMemberOpen) {
            setMemberToEdit(null);
        }
    }, [isAddMemberOpen]);
    
    const handleViewDetails = (member: User) => {
        setSelectedMember(member);
        setIsDetailsOpen(true);
    };

    const handleAddMemberClick = () => {
        setMemberToEdit(null);
        setIsAddMemberOpen(true);
    };

    const handleEditMember = (member: User) => {
        setMemberToEdit(member);
        setIsAddMemberOpen(true);
    };

    const handleDeleteMember = async (memberId: string) => {
        if (!user) return;
        await deleteDoc(doc(firestore, 'users', user.uid, 'teamMembers', memberId));
        toast({
            title: "Member Deleted",
            description: "The team member has been removed.",
            variant: "destructive"
        });
    };

    const handleSaveMember = async (member: Omit<User, 'id' | 'agency_id'> & { id?: string, password?: string }) => {
        if (!user || !auth || !profile.agency_id) {
            toast({ title: 'User or profile data not available.', variant: 'destructive' });
            return;
        }

        // Logic for editing an existing member
        if (memberToEdit) {
            const memberRef = doc(firestore, 'users', user.uid, 'teamMembers', memberToEdit.id);
            const memberData = {
                name: member.name,
                email: member.email,
                phone: member.phone,
                role: member.role,
            };
            try {
                await setDoc(memberRef, memberData, { merge: true });
                toast({ title: 'Member Updated Successfully' });
            } catch (error) {
                console.error("Error updating member: ", error);
                toast({ title: 'Error', description: 'Could not update team member.', variant: 'destructive' });
            }
            return;
        }

        // Logic for creating a new member
        if (!member.email || !member.password) {
            toast({ title: 'Missing Fields', description: 'Email and password are required for a new member.', variant: 'destructive' });
            return;
        }

        const currentAdminUser = auth.currentUser;
        if (!currentAdminUser || !currentAdminUser.email) {
            toast({ title: 'Admin session is invalid. Please re-login.', variant: 'destructive' });
            return;
        }

        const adminEmail = currentAdminUser.email;
        const adminPassword = sessionStorage.getItem('fb-cred'); // Retrieve stored password

        if (!adminPassword) {
            toast({ title: 'Admin session error', description: 'Could not verify admin credentials. Please re-login and try again.', variant: 'destructive' });
            return;
        }

        try {
            // 1. Create a new Firebase Auth user
            const newUserCredential = await createUserWithEmailAndPassword(auth, member.email, member.password);
            const newMemberUser = newUserCredential.user;

            // 2. Save new member's data to the admin's teamMembers subcollection
            const memberData = {
                id: newMemberUser.uid,
                name: member.name,
                email: member.email,
                phone: member.phone,
                role: member.role,
                agency_id: profile.agency_id,
                stats: { propertiesSold: 0, activeBuyers: 0, appointmentsToday: 0 },
            };
            await setDoc(doc(firestore, 'users', user.uid, 'teamMembers', newMemberUser.uid), memberData);

            // 3. Create a user doc for the new member so they can log in and have a profile
            await setDoc(doc(firestore, "users", newMemberUser.uid), {
                id: newMemberUser.uid,
                name: member.name,
                email: member.email,
                role: member.role,
                agency_id: profile.agency_id,
                createdAt: new Date().toISOString(),
            });

            toast({ title: 'Member Added Successfully' });

        } catch (error: any) {
            console.error("Error creating member: ", error);
            let errorMessage = "An unexpected error occurred.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email address is already registered.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'The password is too weak. It must be at least 6 characters.';
            }
            toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
        } finally {
            // 4. IMPORTANT: Re-sign in the admin user to restore their session
            // This is necessary because createUserWithEmailAndPassword signs out the current user.
            try {
                const adminCredential = EmailAuthProvider.credential(adminEmail, adminPassword);
                await signInWithCredential(auth, adminCredential);
            } catch (reauthError) {
                console.error("Failed to re-authenticate admin:", reauthError);
                toast({ title: 'Session Warning', description: 'Failed to restore your session. Please login again.', variant: 'destructive' });
                router.push('/login'); // Force re-login
            }
        }
    };


     const allMembers = useMemo(() => {
        if (!user || !profile || !profile.ownerName) return [];

        const adminAsMember: User = {
            id: user.uid,
            name: profile.ownerName,
            email: user.email || '',
            role: 'Admin',
            agency_id: profile.agency_id,
            stats: { propertiesSold: 0, activeBuyers: 0, appointmentsToday: 0 }
        };
        
        return [adminAsMember, ...(teamMembers || [])];

    }, [user, profile, teamMembers]);


  return (
    <>
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Team</h1>
                    <p className="text-muted-foreground">Manage your team members.</p>
                </div>
                {profile.role === 'Admin' && <Button className="glowing-btn" onClick={handleAddMemberClick}><UserPlus/> Add Member</Button>}
            </div>

            {isLoading ? <p>Loading team members...</p> : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {allMembers && allMembers.map(member => (
                    <Card key={member.id} className="flex flex-col hover:shadow-primary/10 transition-shadow">
                        <CardHeader className="flex-row items-start justify-between pb-2">
                             <div>
                                <Badge variant={roleVariant[member.role] ?? 'secondary'} className="capitalize">{member.role}</Badge>
                                <Badge variant="success" className="capitalize ml-2">Active</Badge>
                             </div>
                             {profile.role === 'Admin' && member.role !== 'Admin' && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="rounded-full -mt-2 -mr-2" onClick={(e) => e.stopPropagation()}>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="glass-card">
                                        <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleViewDetails(member); }}>
                                            <Eye /> View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleEditMember(member); }}>
                                            <Edit /> Edit Member
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleDeleteMember(member.id); }} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                                            <Trash2 /> Delete Member
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                             )}
                        </CardHeader>
                        <CardContent className="text-center flex-1 cursor-pointer" onClick={() => handleViewDetails(member)}>
                            <CardTitle className="font-headline mt-4">{member.name}</CardTitle>
                            <CardDescription>{member.email || 'No email provided'}</CardDescription>
                        </CardContent>
                        {member.stats && (
                            <CardFooter className="grid grid-cols-3 gap-2 border-t pt-4">
                               <StatItem icon={HandCoins} value={member.stats.propertiesSold} label="Properties Sold" />
                               <StatItem icon={Users} value={member.stats.activeBuyers} label="Active Buyers" />
                               <StatItem icon={CalendarCheck} value={member.stats.appointmentsToday} label="Appts Today" />
                            </CardFooter>
                        )}
                    </Card>
                ))}
            </div>
            )}
        </div>
        {selectedMember && (
            <TeamMemberDetailsDialog
                member={selectedMember}
                isOpen={isDetailsOpen}
                setIsOpen={setIsDetailsOpen}
            />
        )}
         {profile.role === 'Admin' && (
            <AddTeamMemberDialog
                isOpen={isAddMemberOpen}
                setIsOpen={setIsAddMemberOpen}
                memberToEdit={memberToEdit}
                onSave={handleSaveMember}
            />
         )}
    </>
  );
}
