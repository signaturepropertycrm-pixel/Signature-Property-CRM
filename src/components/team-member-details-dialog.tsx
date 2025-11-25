

'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Shield, User as UserIcon, Edit } from 'lucide-react';
import { useMemo } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import { collection } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/hooks';
import { Property, Buyer } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useProfile } from '@/context/profile-context';

interface TeamMemberDetailsDialogProps {
  member: User;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const roleConfig: Record<string, { icon: React.ReactNode }> = {
    Admin: { icon: <Shield className="h-4 w-4" /> },
    Agent: { icon: <UserIcon className="h-4 w-4" /> },
};


export function TeamMemberDetailsDialog({
  member,
  isOpen,
  setIsOpen,
}: TeamMemberDetailsDialogProps) {
  const { profile } = useProfile();
  const firestore = useFirestore();

  const propertiesQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'properties') : null, [profile.agency_id, firestore]);
  const { data: properties } = useCollection<Property>(propertiesQuery);
  
  const buyersQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'buyers') : null, [profile.agency_id, firestore]);
  const { data: buyers } = useCollection<Buyer>(buyersQuery);

  const memberStats = useMemo(() => {
    if (!member || !properties || !buyers) return { soldProperties: 0, hotLeads: 0, followUps: 0 };

    const soldProperties = properties.filter(p => p.status === 'Sold' && p.sold_by_agent_id === member.id).length;
    // Since assignment is removed, we check for buyers created by the agent
    const agentBuyers = buyers.filter(b => b.created_by === member.id);
    const hotLeads = agentBuyers.filter(b => b.status === 'Interested').length;
    const followUps = agentBuyers.filter(b => b.status === 'Follow Up').length;

    return { soldProperties, hotLeads, followUps };
  }, [member, properties, buyers]);


  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="items-center text-center">
             <Avatar className="h-24 w-24 mb-4 border-4 border-primary/20">
                <AvatarImage src={member.avatar} />
                <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
          <DialogTitle className="text-2xl font-headline">{member.name}</DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center justify-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1.5">
                    {roleConfig[member.role]?.icon}
                    {member.role}
                </Badge>
                <span>-</span>
                <span>{member.email}</span>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Properties Sold</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{memberStats.soldProperties}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Interested Leads</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{memberStats.hotLeads}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Follow-ups</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{memberStats.followUps}</div>
                </CardContent>
            </Card>
        </div>
        <DialogFooter>
          <Button className="w-full" variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
