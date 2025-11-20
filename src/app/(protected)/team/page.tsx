
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
import { collection, doc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useProfile } from '@/context/profile-context';
import { useMemoFirebase } from '@/firebase/hooks';
import { useRouter } from 'next/navigation';

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
    const router = useRouter();
    const { user: currentUser } = useUser();
    const { profile } = useProfile();
    const teamMembersQuery = useMemoFirebase(() => (currentUser && profile.role === 'Admin') ? collection(firestore, 'users', currentUser.uid, 'teamMembers') : null, [currentUser, firestore, profile.role]);
    const { data: teamMembers, isLoading } = useCollection<User>(teamMembersQuery);

    const [selectedMember, setSelectedMember] = useState<User | null>(null);
    const [memberToEdit, setMemberToEdit] = useState<User | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const { toast } = useToast();
    
    // Redirect if not admin
    useEffect(() => {
        if (profile.role && profile.role !== 'Admin') {
            router.push('/dashboard');
        }
    }, [profile, router]);


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
        if (!currentUser) return;
        await deleteDoc(doc(firestore, 'users', currentUser.uid, 'teamMembers', memberId));
        // Note: This only removes the reference from the team list. 
        // A cloud function should ideally handle deleting the actual auth user and their main user document.
        toast({
            title: "Member Removed",
            description: "The team member has been removed from your team list.",
            variant: "destructive"
        });
    };

    const handleSaveMember = async (member: Omit<User, 'id' | 'agency_id'> & { id?: string, password?: string }) => {
        if (!currentUser || !auth || !profile.agency_id) {
            toast({ title: 'User or profile data not available.', variant: 'destructive' });
            return;
        }

        // --- EDIT LOGIC ---
        if (memberToEdit) {
            const memberRef = doc(firestore, 'users', currentUser.uid, 'teamMembers', memberToEdit.id);
            const userDocRef = doc(firestore, 'users', memberToEdit.id);
            const batch = writeBatch(firestore);
            
            batch.update(userDocRef, { role: member.role });
            batch.update(memberRef, { name: member.name, phone: member.phone, role: member.role });

            try {
                await batch.commit();
                toast({ title: 'Member Updated Successfully' });
            } catch (error) {
                 console.error("Error updating member: ", error);
                 toast({ title: 'Error', description: 'Could not update team member.', variant: 'destructive' });
            }
            return;
        }

        // --- CREATE LOGIC ---
        if (!member.email || !member.password) {
            toast({ title: 'Missing Fields', description: 'Email and password are required for a new member.', variant: 'destructive' });
            return;
        }
        
        const adminPassword = sessionStorage.getItem('fb-cred');
        if (!adminPassword || !currentUser.email) {
            toast({ title: 'Authentication Error', description: 'Admin session is invalid. Please log in again.', variant: 'destructive' });
            return;
        }

        try {
            // Re-authenticate admin to perform secure actions
            const adminCredential = EmailAuthProvider.credential(currentUser.email, adminPassword);
            await signInWithCredential(auth, adminCredential);

            // Create new user in a temporary auth instance to avoid state conflicts
            const newUserCredential = await createUserWithEmailAndPassword(auth, member.email, member.password);
            const newUID = newUserCredential.user.uid;

            // Re-sign in admin immediately to restore auth state
            await signInWithCredential(auth, adminCredential);

            const batch = writeBatch(firestore);
            
            // Doc 1: The new user's main document in the top-level 'users' collection
            const newUserDocRef = doc(firestore, 'users', newUID);
            batch.set(newUserDocRef, {
                id: newUID,
                name: member.name,
                email: member.email,
                phone: member.phone,
                role: member.role,
                agency_id: profile.agency_id, // CRITICAL: Assign to the admin's agency
                createdBy: currentUser.uid,
                createdAt: serverTimestamp(),
            });

            // Doc 2: The reference in the admin's 'teamMembers' subcollection
            const teamMemberDocRef = doc(firestore, 'users', currentUser.uid, 'teamMembers', newUID);
            batch.set(teamMemberDocRef, {
                id: newUID,
                name: member.name,
                email: member.email,
                phone: member.phone,
                role: member.role,
                agency_id: profile.agency_id,
                stats: { propertiesSold: 0, activeBuyers: 0, appointmentsToday: 0 },
            });
            
            // Doc 3: The role document for security rules
            const roleCollection = member.role === 'Editor' ? 'roles_editor' : 'roles_agent';
            const roleDocRef = doc(firestore, roleCollection, newUID);
            batch.set(roleDocRef, {});

            await batch.commit();
            
            toast({ title: 'Member Added Successfully' });

        } catch (error: any) {
            console.error("Error creating member: ", error);
            let errorMessage = "An unexpected error occurred.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email address is already registered.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'The password is too weak. It must be at least 6 characters.';
            } else if (error.code === 'auth/invalid-credential') {
                 errorMessage = 'Your admin password in session is incorrect. Please log out and log in again.';
            }
            toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
            
            // If creation failed, try to re-login admin to prevent session loss
            if (currentUser.email && adminPassword) {
                 try {
                    const adminCredential = EmailAuthProvider.credential(currentUser.email, adminPassword);
                    await signInWithCredential(auth, adminCredential);
                 } catch (reauthError) {
                     console.error("Admin re-authentication failed after error:", reauthError);
                 }
            }
        }
    };


     const allMembers = useMemo(() => {
        if (!currentUser || !profile || !profile.ownerName) return [];

        const adminAsMember: User = {
            id: currentUser.uid,
            name: profile.ownerName,
            email: currentUser.email || '',
            role: 'Admin',
            agency_id: profile.agency_id,
            stats: { propertiesSold: 0, activeBuyers: 0, appointmentsToday: 0 }
        };
        
        return teamMembers ? [adminAsMember, ...teamMembers] : [adminAsMember];

    }, [currentUser, profile, teamMembers]);
    
    if (profile.role && profile.role !== 'Admin') {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Card className="max-w-md text-center">
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>
                            This page is only accessible to the Admin.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }


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
