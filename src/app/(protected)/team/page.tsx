
'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { teamMembers } from '@/lib/data';
import { UserPlus, Edit, Trash2 } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const roleVariant = {
    Admin: 'default',
    Agent: 'secondary',
    Viewer: 'outline',
} as const;

export default function TeamPage() {
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


  return (
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
                <Card key={member.id} className="text-center hover:shadow-primary/10 transition-shadow">
                    <CardHeader className="items-center">
                        <Avatar className="w-24 h-24 border-4 border-primary/20">
                            <AvatarImage src={getAvatar(member.role)?.imageUrl} data-ai-hint={getAvatar(member.role)?.imageHint} />
                            <AvatarFallback>{member.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                    </CardHeader>
                    <CardContent>
                        <CardTitle className="font-headline">{member.name}</CardTitle>
                        <CardDescription>{member.email}</CardDescription>
                        <Badge variant={roleVariant[member.role]} className="mt-4">{member.role}</Badge>
                    </CardContent>
                    <CardFooter className="flex justify-center gap-2">
                        <Button variant="outline" size="icon"><Edit className="h-4 w-4"/></Button>
                        <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4"/></Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    </div>
  );
}
