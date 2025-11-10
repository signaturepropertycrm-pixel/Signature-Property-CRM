
'use client';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { teamMembers } from '@/lib/data';
import { UserPlus, HandCoins, Users, CalendarCheck, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { User } from '@/lib/types';
import { TeamMemberDetailsDialog } from '@/components/team-member-details-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


const roleVariant = {
    Admin: 'default',
    Agent: 'secondary',
    Viewer: 'outline',
} as const;

const StatItem = ({ icon, value, label }: { icon: React.ElementType, value: number, label: string }) => (
    <div className="flex flex-col items-center gap-1 text-center">
        <div className="flex items-center gap-2">
            <icon className="h-4 w-4 text-muted-foreground" />
            <span className="font-bold text-lg">{value}</span>
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
    </div>
);


export default function TeamPage() {
    const [selectedMember, setSelectedMember] = useState<User | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const adminAvatar = PlaceHolderImages.find(p => p.id === 'avatar-admin');
    const agentAvatar = PlaceHolderImages.find(p => p.id === 'avatar-agent');
    const viewerAvatar = PlaceHolderImages.find(p => p.id === 'avatar-viewer');

    const getAvatar = (role: 'Admin' | 'Agent' | 'Viewer') => {
        switch (role) {
            case 'Admin': return adminAvatar;
            case 'Agent': return agentAvatar;
            case 'Viewer': return viewerAvatar;
        }
    }
    
    const handleCardClick = (member: User) => {
        setSelectedMember(member);
        setIsDetailsOpen(true);
    };


  return (
    <>
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Team</h1>
                    <p className="text-muted-foreground">Manage your team members.</p>
                </div>
                <Button className="glowing-btn"><UserPlus/> Add Team Member</Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {teamMembers.map(member => (
                    <Card key={member.id} className="flex flex-col hover:shadow-primary/10 transition-shadow cursor-pointer" onClick={() => handleCardClick(member)}>
                        <CardHeader className="flex-row items-center justify-between">
                            <Badge variant={roleVariant[member.role]} className="capitalize">{member.role}</Badge>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-full" onClick={(e) => e.stopPropagation()}>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="glass-card">
                                    <DropdownMenuItem onSelect={() => {}}>
                                        <Edit /> Edit Member
                                    </DropdownMenuItem>
                                     <DropdownMenuItem onSelect={() => {}} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                                        <Trash2 /> Delete Member
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent className="text-center flex-1">
                            <Avatar className="w-24 h-24 border-4 border-primary/20 mx-auto">
                                <AvatarImage src={getAvatar(member.role)?.imageUrl} data-ai-hint={getAvatar(member.role)?.imageHint} />
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
    </>
  );
}
