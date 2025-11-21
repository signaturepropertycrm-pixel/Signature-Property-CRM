
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, PlusCircle, Trash2, Edit, User, Shield } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AddTeamMemberDialog } from '@/components/add-team-member-dialog';
import type { User as TeamMember, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/context/profile-context';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/hooks';
import { collection, doc, deleteDoc, writeBatch } from 'firebase/firestore';

const roleConfig = {
    Admin: { icon: <Shield className="h-4 w-4" />, color: 'bg-red-500/10 text-red-500' },
    Editor: { icon: <Edit className="h-4 w-4" />, color: 'bg-yellow-500/10 text-yellow-500' },
    Agent: { icon: <User className="h-4 w-4" />, color: 'bg-green-500/10 text-green-500' },
};

export default function TeamPage() {
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);
    const { toast } = useToast();
    const { profile } = useProfile();
    const firestore = useFirestore();

    const teamMembersQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'teamMembers') : null, [profile.agency_id, firestore]);
    const { data: teamMembers, isLoading } = useCollection<TeamMember>(teamMembersQuery);

    const handleEdit = (member: TeamMember) => {
        setMemberToEdit(member);
        setIsAddMemberOpen(true);
    };

    const handleDelete = async (member: TeamMember) => {
        if (!profile.agency_id) return;
        
        const batch = writeBatch(firestore);

        // Delete from agency's teamMembers subcollection
        const teamMemberRef = doc(firestore, 'agencies', profile.agency_id, 'teamMembers', member.id);
        batch.delete(teamMemberRef);
        
        // Delete the role indicator document
        const roleCollection = member.role === 'Agent' ? 'roles_agent' : 'roles_editor';
        const roleRef = doc(firestore, roleCollection, member.id);
        batch.delete(roleRef);
        
        // Optionally: Delete the user's main account document if they shouldn't exist without an agency
        // For now, we leave the user doc to allow them to be re-assigned.
        // const userRef = doc(firestore, 'users', member.id);
        // batch.delete(userRef);

        await batch.commit();
        
        toast({
            title: 'Member Removed',
            description: 'The team member has been removed from your agency.',
            variant: 'destructive',
        });
    };

    const sortedTeamMembers = useMemo(() => {
        if (!teamMembers) return [];
        const roleOrder: Record<UserRole, number> = { Admin: 1, Editor: 2, Agent: 3 };
        return [...teamMembers].sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
    }, [teamMembers]);


    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight font-headline">
                            Team Management
                        </h1>
                        <p className="text-muted-foreground">
                            Add, view, and manage your agency's team members.
                        </p>
                    </div>
                </div>

                {isLoading && <p>Loading team members...</p>}

                {!isLoading && (!sortedTeamMembers || sortedTeamMembers.length === 0) ? (
                     <Card className="flex items-center justify-center h-64 border-dashed">
                        <div className="text-center">
                            <p className="text-lg font-medium">No team members yet</p>
                            <p className="text-muted-foreground">Click "Add Member" to build your team.</p>
                        </div>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {sortedTeamMembers.map(member => {
                            const config = roleConfig[member.role] || roleConfig.Agent;
                            const isOwner = member.id === profile.user_id;
                            return (
                                <Card key={member.id} className="flex flex-col hover:shadow-lg transition-shadow">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <Badge variant="outline" className={config.color}>{config.icon} {member.role}</Badge>
                                        {!isOwner && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(member)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit Role
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(member)} className="text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Remove
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </CardHeader>
                                    <CardContent className="text-center flex-1 flex flex-col items-center justify-center">
                                        <Avatar className="h-20 w-20 mb-4 border-4 border-primary/20">
                                            <AvatarImage src={`https://i.pravatar.cc/150?u=${member.email}`} />
                                            <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                        </Avatar>
                                        <CardTitle className="text-lg font-headline">{member.name}</CardTitle>
                                        <CardDescription>{member.email}</CardDescription>
                                    </CardContent>
                                    <CardFooter className="border-t p-2">
                                        <div className='text-xs text-center w-full text-muted-foreground'>Leads: 0 | Sold: 0</div>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>

            <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-50">
               <Button onClick={() => { setMemberToEdit(null); setIsAddMemberOpen(true); }} className="rounded-full w-14 h-14 shadow-lg glowing-btn" size="icon">
                    <PlusCircle className="h-6 w-6" />
                    <span className="sr-only">Add Member</span>
                </Button>
            </div>

            <AddTeamMemberDialog 
                isOpen={isAddMemberOpen} 
                setIsOpen={setIsAddMemberOpen} 
                memberToEdit={memberToEdit}
            />
        </>
    );
}
