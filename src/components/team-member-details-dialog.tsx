
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
import type { User, Property, Buyer } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Shield, User as UserIcon, Edit, TrendingUp, CheckCircle, PhoneCall } from 'lucide-react';
import { useMemo } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import { collection } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/hooks';
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

  // Correctly querying subcollections with the agencyId
  const propertiesQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'properties') : null, [profile.agency_id, firestore]);
  const { data: properties } = useCollection<Property>(propertiesQuery);
  
  const buyersQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'buyers') : null, [profile.agency_id, firestore]);
  const { data: buyers } = useCollection<Buyer>(buyersQuery);
  
  const followUpsQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'followUps') : null, [profile.agency_id, firestore]);
  const { data: followUps } = useCollection(followUpsQuery);

  const stats = useMemo(() => {
    if (!member || !properties || !buyers || !followUps) {
      return { propertiesSold: 0, interestedLeads: 0, followUpsDue: 0 };
    }
    const propertiesSold = properties.filter(p => p.status === 'Sold' && p.sold_by_agent_id === member.id).length;
    const interestedLeads = buyers.filter(b => b.assignedTo === member.id && b.status === 'Interested').length;
    const followUpsDue = followUps.filter((f: any) => buyers.some(b => b.id === f.buyerId && b.assignedTo === member.id)).length;
    
    return { propertiesSold, interestedLeads, followUpsDue };
  }, [member, properties, buyers, followUps]);


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

        <div className="py-4">
             <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2"><TrendingUp /> Performance Stats</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-2xl font-bold">{stats.propertiesSold}</p>
                            <p className="text-xs text-muted-foreground">Properties Sold</p>
                        </div>
                         <div>
                            <p className="text-2xl font-bold">{stats.interestedLeads}</p>
                            <p className="text-xs text-muted-foreground">Interested Leads</p>
                        </div>
                         <div>
                            <p className="text-2xl font-bold">{stats.followUpsDue}</p>
                            <p className="text-xs text-muted-foreground">Follow-ups</p>
                        </div>
                    </div>
                </CardContent>
             </Card>
        </div>

        <DialogFooter className="mt-4">
          <Button className="w-full" variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
