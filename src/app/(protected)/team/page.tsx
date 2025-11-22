

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, PlusCircle, Trash2, Edit, User, Shield, Clock, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AddTeamMemberDialog } from '@/components/add-team-member-dialog';
import type { User as TeamMember, UserRole, Property, Buyer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/context/profile-context';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/hooks';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { TeamMemberDetailsDialog } from '@/components/team-member-details-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const roleConfig: Record<UserRole | 'Pending', { icon: React.ReactNode, color: string }> = {
    Admin: { icon: <Shield className="h-4 w-4" />, color: 'bg-red-500/10 text-red-500' },
    Editor: { icon: <Edit className="h-4 w-4" />, color: 'bg-yellow-500/10 text-yellow-500' },
    Agent: { icon: <User className="h-4 w-4" />, color: 'bg-green-500/10 text-green-500' },
    Pending: { icon: <Clock className="h-4 w-4" />, color: 'bg-gray-500/10 text-gray-500' },
};

export default function TeamPage() {
    const isMobile = useIsMobile();
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const { toast } = useToast();
    const { profile } = useProfile();
    const firestore = useFirestore();

    const teamMembersQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'teamMembers') : null, [profile.agency_id, firestore]);
    const { data: teamMembers, isLoading: isMembersLoading } = useCollection<TeamMember>(teamMembersQuery);

    const propertiesQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'properties') : null, [profile.agency_id, firestore]);
    const { data: properties, isLoading: isPropertiesLoading } = useCollection<Property>(propertiesQuery);
    
    const buyersQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'buyers') : null, [profile.agency_id, firestore]);
    const { data: buyers, isLoading: isBuyersLoading } = useCollection<Buyer>(buyersQuery);


    const handleEdit = (member: TeamMember) => {
        setMemberToEdit(member);
        setIsAddMemberOpen(true);
    };

    const handleDelete = async (member: TeamMember) => {
        if (!profile.agency_id || !member.id) return;
        
        const memberRef = doc(firestore, 'agencies', profile.agency_id, 'teamMembers', member.id);
        await deleteDoc(memberRef);
        
        toast({
            title: 'Invitation Revoked',
            description: `The invitation for ${member.email} has been revoked.`,
            variant: 'destructive',
        });
    };

    const handleCardClick = (member: TeamMember) => {
        if(member.status === 'Pending') return;
        setSelectedMember(member);
        setIsDetailsOpen(true);
    };

    const sortedTeamMembers = useMemo(() => {
        if (!teamMembers) return [];
        const roleOrder: Record<string, number> = { Admin: 1, Editor: 2, Agent: 3, Pending: 4 };
        return [...teamMembers].sort((a, b) => {
            const statusA = a.status || 'Active';
            const statusB = b.status || 'Active';
            if (statusA === 'Pending' && statusB !== 'Pending') return 1;
            if (statusB === 'Pending' && statusA !== 'Pending') return -1;
            return (roleOrder[a.role] || 5) - (roleOrder[b.role] || 5);
        });
    }, [teamMembers]);

    const memberStats = useMemo(() => {
        const stats: Record<string, { assignedBuyers: number; soldProperties: number }> = {};
        if (!teamMembers || !properties || !buyers) return stats;

        for (const member of teamMembers) {
            if (member.status === 'Active') {
                const assignedBuyers = buyers.filter(b => b.assignedTo === member.id).length;
                const soldProperties = properties.filter(p => p.status === 'Sold' && p.soldByAgentId === member.id).length;
                stats[member.id] = { assignedBuyers, soldProperties };
            }
        }
        return stats;
    }, [teamMembers, properties, buyers]);
    
    const isLoading = isMembersLoading || isPropertiesLoading || isBuyersLoading;

    const renderTable = () => (
        <Card>
        <CardContent className="p-0">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned Buyers</TableHead>
                    <TableHead>Properties Sold</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedTeamMembers.map(member => {
                    const isPending = member.status === 'Pending';
                    const displayRole = isPending ? 'Pending' : member.role;
                    const config = roleConfig[displayRole] || roleConfig.Agent;
                    const isOwner = member.id === profile.user_id;
                    const stats = memberStats[member.id] || { assignedBuyers: 0, soldProperties: 0 };
                    
                    return (
                        <TableRow key={member.id || member.email} onClick={() => handleCardClick(member)} className={cn('cursor-pointer', isPending && 'opacity-70 bg-muted/50')}>
                            <TableCell className="font-medium">
                                <div>
                                    <p className="font-bold">{member.name || 'Invitation Sent'}</p>
                                    <p className="text-xs text-muted-foreground">{member.email}</p>
                                </div>
                            </TableCell>
                            <TableCell><Badge variant="outline" className={config.color}>{config.icon} {displayRole}</Badge></TableCell>
                            <TableCell>
                                <Badge variant={isPending ? 'secondary' : 'default'} className={cn(!isPending && 'bg-green-600/80')}>{member.status || 'Active'}</Badge>
                            </TableCell>
                            <TableCell className="text-center font-bold">{isPending ? 'N/A' : stats.assignedBuyers}</TableCell>
                            <TableCell className="text-center font-bold">{isPending ? 'N/A' : stats.soldProperties}</TableCell>
                            <TableCell className="text-right">
                                {!isOwner && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {!isPending && (
                                                <DropdownMenuItem onClick={() => handleEdit(member)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit Role
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem onClick={() => handleDelete(member)} className="text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" /> {isPending ? 'Revoke Invite' : 'Remove Member'}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
        </CardContent>
        </Card>
    );

    const renderCards = () => (
        <div className="space-y-4">
        {sortedTeamMembers.map(member => {
            const isPending = member.status === 'Pending';
            const displayRole = isPending ? 'Pending' : member.role;
            const config = roleConfig[displayRole] || roleConfig.Agent;
            const isOwner = member.id === profile.user_id;
            const stats = memberStats[member.id] || { assignedBuyers: 0, soldProperties: 0 };

            return (
                <Card 
                    key={member.id || member.email} 
                    className={cn("flex flex-col hover:shadow-lg transition-shadow cursor-pointer", isPending && "opacity-70 bg-muted/50")}
                    onClick={() => handleCardClick(member)}
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <Badge variant="outline" className={config.color}>{config.icon} {displayRole}</Badge>
                        {!isOwner && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                    {!isPending && (
                                        <DropdownMenuItem onClick={() => handleEdit(member)}>
                                            <Edit className="mr-2 h-4 w-4" /> Edit Role
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => handleDelete(member)} className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" /> {isPending ? 'Revoke Invite' : 'Remove Member'}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </CardHeader>
                    <CardContent className="text-center flex-1 flex flex-col items-center justify-center">
                        <CardTitle className="text-lg font-headline">{member.name || 'Invitation Sent'}</CardTitle>
                        <CardDescription>{member.email}</CardDescription>
                    </CardContent>
                    <CardFooter className="border-t p-0">
                        {isPending ? (
                            <div className='text-xs text-center w-full text-muted-foreground py-2'>
                                {`Invited on ${member.invitedAt?.toDate().toLocaleDateString()}`}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 divide-x w-full">
                                <div className="flex flex-col items-center justify-center p-2">
                                    <span className="text-xs text-muted-foreground">Buyers</span>
                                    <span className="font-bold">{stats.assignedBuyers}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-2">
                                    <span className="text-xs text-muted-foreground">Sold</span>
                                    <span className="font-bold">{stats.soldProperties}</span>
                                </div>
                            </div>
                        )}
                    </CardFooter>
                </Card>
            )
        })}
        </div>
    );


    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight font-headline">
                            Team Management
                        </h1>
                        <p className="text-muted-foreground">
                            Invite and manage your agency's team members.
                        </p>
                    </div>
                </div>

                {isLoading && <p>Loading team members...</p>}

                {!isLoading && (!sortedTeamMembers || sortedTeamMembers.length === 0) ? (
                     <Card className="flex items-center justify-center h-64 border-dashed">
                        <div className="text-center">
                            <p className="text-lg font-medium">No team members yet</p>
                            <p className="text-muted-foreground">Click the '+' button to invite your first member.</p>
                        </div>
                    </Card>
                ) : (
                    isMobile ? renderCards() : renderTable()
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

            {selectedMember && (
                <TeamMemberDetailsDialog 
                    isOpen={isDetailsOpen}
                    setIsOpen={setIsDetailsOpen}
                    member={selectedMember}
                />
            )}
        </>
    );
}
