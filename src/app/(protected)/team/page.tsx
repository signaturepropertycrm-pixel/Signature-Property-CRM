
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
    const { profile, isLoading: isProfileLoading } = useProfile();
    
    const teamMembersQuery = useMemoFirebase(() => 
        (currentUser && profile.role === 'Admin') 
            ? collection(firestore, 'users', currentUser.uid, 'teamMembers') 
            : null
    , [currentUser, firestore, profile.role]);

    const { data: teamMembersData, isLoading: isTeamLoading } = useCollection<User>(teamMembersQuery);

    const [selectedMember, setSelectedMember] = useState<User | null>(null);
    const [memberToEdit, setMemberToEdit] = useState<User | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const { toast } = useToast();
    
    useEffect(() => {
        if (!isProfileLoading && profile.role && profile.role !== 'Admin') {
            router.push('/dashboard');
        }
    }, [profile, isProfileLoading, router]);

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
        
        const batch = writeBatch(firestore);
        
        const teamMemberRef = doc(firestore, 'users', currentUser.uid, 'teamMembers', memberId);
        const userDocRef = doc(firestore, 'users', memberId);
        
        batch.delete(teamMemberRef);
        batch.delete(userDocRef);
        
        const agentRoleRef = doc(firestore, 'roles_agent', memberId);
        const editorRoleRef = doc(firestore, 'roles_editor', memberId);
        batch.delete(agentRoleRef);
        batch.delete(editorRoleRef);
        
        await batch.commit();

        toast({
            title: "Member Removed",
            description: "The team member has been removed from your team and their user document has been deleted.",
            variant: "destructive"
        });
    };

    const handleSaveMember = async (memberData: Omit<User, 'id' | 'agency_id'> & { id?: string, password?: string }) => {
        if (!currentUser || !auth || !profile.agency_id) {
            toast({ title: 'Admin user or profile data not available.', variant: 'destructive' });
            return;
        }

        if (memberToEdit) {
             const batch = writeBatch(firestore);
            const teamMemberRef = doc(firestore, 'users', currentUser.uid, 'teamMembers', memberToEdit.id);
            const userDocRef = doc(firestore, 'users', memberToEdit.id);
            
            const updatedData = { name: memberData.name, phone: memberData.phone, role: memberData.role };

            batch.update(userDocRef, { role: memberData.role, name: memberData.name, phone: memberData.phone });
            batch.update(teamMemberRef, updatedData);
            
            if (memberToEdit.role !== memberData.role) {
                if (memberData.role === 'Agent') {
                    batch.set(doc(firestore, 'roles_agent', memberToEdit.id), { agency_id: profile.agency_id });
                    batch.delete(doc(firestore, 'roles_editor', memberToEdit.id));
                } else if (memberData.role === 'Editor') {
                    batch.set(doc(firestore, 'roles_editor', memberToEdit.id), { agency_id: profile.agency_id });
                    batch.delete(doc(firestore, 'roles_agent', memberToEdit.id));
                }
            }

            try {
                await batch.commit();
                toast({ title: 'Member Updated Successfully' });
            } catch (error) {
                 console.error("Error updating member: ", error);
                 toast({ title: 'Error', description: 'Could not update team member.', variant: 'destructive' });
            }
            return;
        }

        if (!memberData.email || !memberData.password) {
            toast({ title: 'Missing Fields', description: 'Email and password are required for a new member.', variant: 'destructive' });
            return;
        }

        const adminPassword = sessionStorage.getItem('fb-cred');
        if (!adminPassword || !currentUser.email) {
            toast({ title: 'Admin Authentication Error', description: 'Your session is invalid. Please log out and log in again to add new members.', variant: 'destructive' });
            return;
        }
        
        try {
            const adminCredential = EmailAuthProvider.credential(currentUser.email, adminPassword);
            await signInWithCredential(auth, adminCredential);

            const newUserCredential = await createUserWithEmailAndPassword(auth, memberData.email, memberData.password);
            const newUID = newUserCredential.user.uid;

            await signInWithCredential(auth, adminCredential);
            
            const batch = writeBatch(firestore);

            const newUserDocRef = doc(firestore, 'users', newUID);
            batch.set(newUserDocRef, {
                id: newUID,
                name: memberData.name,
                email: memberData.email,
                phone: memberData.phone || '',
                role: memberData.role,
                agency_id: profile.agency_id, // *** CRITICAL FIX: Use Admin's agency_id ***
                createdBy: currentUser.uid,
                createdAt: serverTimestamp(),
            });

            const teamMemberDocRef = doc(firestore, 'users', currentUser.uid, 'teamMembers', newUID);
            batch.set(teamMemberDocRef, {
                id: newUID,
                name: memberData.name,
                email: memberData.email,
                phone: memberData.phone || '',
                role: memberData.role,
                agency_id: profile.agency_id, // *** CRITICAL FIX: Use Admin's agency_id ***
                stats: { propertiesSold: 0, activeBuyers: 0, appointmentsToday: 0 },
            });
            
            const roleCollection = memberData.role === 'Editor' ? 'roles_editor' : 'roles_agent';
            const roleDocRef = doc(firestore, roleCollection, newUID);
            batch.set(roleDocRef, { agency_id: profile.agency_id });

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
            toast({ title: 'Error Creating Member', description: errorMessage, variant: 'destructive' });
        }
    };

    const allMembers = useMemo(() => {
        if (!currentUser || isProfileLoading || !profile.agency_id) return [];

        const adminAsMember: User = {
            id: currentUser.uid,
            name: profile.ownerName,
            email: currentUser.email || '',
            role: 'Admin',
            agency_id: profile.agency_id,
            stats: { propertiesSold: 0, activeBuyers: 0, appointmentsToday: 0 }
        };
        
        return teamMembersData ? [adminAsMember, ...teamMembersData] : [adminAsMember];

    }, [currentUser, profile, teamMembersData, isProfileLoading]);
    
    if (isProfileLoading || isTeamLoading) {
        return (
             <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight font-headline">Team</h1>
                        <p className="text-muted-foreground">Manage your team members.</p>
                    </div>
                </div>
                <p>Loading team members...</p>
             </div>
        );
    }
    
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
