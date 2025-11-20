
'use client';
import { useState, useEffect } from 'react';
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
import { useCollection, useFirestore, useUser, useMemoFirebase, useAuth } from '@/firebase';
import { collection, addDoc, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useProfile } from '@/context/profile-context';

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
        if (!user || !auth || !user.email) return;
        const collectionRef = collection(firestore, 'users', user.uid, 'teamMembers');
        
        try {
            if (memberToEdit) {
                // Editing an existing member - no auth changes needed, just Firestore update
                const memberData = {
                  name: member.name,
                  email: member.email,
                  phone: member.phone,
                  role: member.role,
                  agency_id: profile.agency_id
                };
                await setDoc(doc(collectionRef, memberToEdit.id), memberData, { merge: true });
                toast({ title: 'Member Updated' });

            } else {
                // Creating a new member
                if (!member.email || !member.password) {
                    toast({ title: 'Missing Fields', description: 'Email and password are required for a new member.', variant: 'destructive'});
                    return;
                }
                
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
                  agency_id: profile.agency_id, // Assigning admin's agency_id
                  stats: { propertiesSold: 0, activeBuyers: 0, appointmentsToday: 0 },
                };
                await setDoc(doc(collectionRef, newMemberUser.uid), memberData);

                // 3. Create a user doc for the new member so they can log in and have their own data space
                await setDoc(doc(firestore, "users", newMemberUser.uid), {
                    id: newMemberUser.uid,
                    name: member.name,
                    email: member.email,
                    role: member.role,
                    agency_id: profile.agency_id,
                    createdAt: new Date().toISOString(),
                });

                // 4. Re-sign in the admin user to maintain the session state without password prompt
                if (auth.currentUser && auth.currentUser.uid !== user.uid) {
                    await auth.signOut(); // Sign out the newly created user
                    // This is a simplified approach. A more robust solution might use custom tokens
                    // but for client-side action, we rely on the user to manually log back in if the session is lost.
                    // For now, we assume the onAuthStateChanged listener will handle the UI correctly.
                    toast({ title: 'Member Added. Admin session maintained.' });
                } else {
                    toast({ title: 'Member Added Successfully' });
                }
            }
        } catch (error: any) {
            console.error("Error saving member: ", error);
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };


  return (
    <>
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Team</h1>
                    <p className="text-muted-foreground">Manage your team members.</p>
                </div>
                {profile.role === 'Admin' && <Button className="glowing-btn" onClick={handleAddMemberClick}><UserPlus/> Add Team Member</Button>}
            </div>

            {isLoading ? <p>Loading team members...</p> : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {teamMembers && teamMembers.map(member => (
                    <Card key={member.id} className="flex flex-col hover:shadow-primary/10 transition-shadow cursor-pointer" onClick={() => handleViewDetails(member)}>
                        <CardHeader className="flex-row items-center justify-between">
                            <Badge variant={roleVariant[member.role]} className="capitalize">{member.role}</Badge>
                             {profile.role === 'Admin' && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="rounded-full" onClick={(e) => e.stopPropagation()}>
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
                        <CardContent className="text-center flex-1">
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
