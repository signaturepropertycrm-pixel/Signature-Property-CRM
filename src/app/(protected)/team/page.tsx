
'use client';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { teamMembers as initialTeamMembers } from '@/lib/data';
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


const roleVariant = {
    Admin: 'default',
    Agent: 'secondary',
    Viewer: 'outline',
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
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [selectedMember, setSelectedMember] = useState<User | null>(null);
    const [memberToEdit, setMemberToEdit] = useState<User | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const savedTeamMembers = localStorage.getItem('teamMembers');
        if (savedTeamMembers) {
            setTeamMembers(JSON.parse(savedTeamMembers));
        } else {
            setTeamMembers(initialTeamMembers);
        }
    }, []);

    useEffect(() => {
        if (teamMembers.length > 0) {
            localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
        }
    }, [teamMembers]);

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

    const handleDeleteMember = (memberId: string) => {
        setTeamMembers(prev => prev.filter(m => m.id !== memberId));
        toast({
            title: "Member Deleted",
            description: "The team member has been removed.",
            variant: "destructive"
        });
    };

    const handleSaveMember = (member: User) => {
        if (memberToEdit) {
            setTeamMembers(prev => prev.map(m => m.id === member.id ? member : m));
        } else {
            setTeamMembers(prev => [...prev, { ...member, id: `TM-${prev.length + 1}` }]);
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
                <Button className="glowing-btn" onClick={handleAddMemberClick}><UserPlus/> Add Team Member</Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {teamMembers.map(member => (
                    <Card key={member.id} className="flex flex-col hover:shadow-primary/10 transition-shadow cursor-pointer" onClick={() => handleViewDetails(member)}>
                        <CardHeader className="flex-row items-center justify-between">
                            <Badge variant={roleVariant[member.role]} className="capitalize">{member.role}</Badge>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-full" onClick={(e) => e.stopPropagation()}>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="glass-card">
                                     <DropdownMenuItem onSelect={() => handleViewDetails(member)}>
                                        <Eye /> View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleEditMember(member)}>
                                        <Edit /> Edit Member
                                    </DropdownMenuItem>
                                     <DropdownMenuItem onSelect={() => handleDeleteMember(member.id)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                                        <Trash2 /> Delete Member
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent className="text-center flex-1">
                            <Avatar className="w-24 h-24 border-4 border-primary/20 mx-auto">
                                <AvatarImage src={member.avatar} data-ai-hint="person portrait" />
                                <AvatarFallback>{member.name.slice(0, 2)}</AvatarFallback>
                            </Avatar>
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
        <AddTeamMemberDialog
            isOpen={isAddMemberOpen}
            setIsOpen={setIsAddMemberOpen}
            memberToEdit={memberToEdit}
            onSave={handleSaveMember}
        />
    </>
  );
}
