
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
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { HandCoins, Users, CalendarCheck, Phone, Mail, UserCog } from 'lucide-react';

interface TeamMemberDetailsDialogProps {
  member: User;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 text-primary">{icon}</div>
        <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="font-semibold">{value || 'N/A'}</div>
        </div>
    </div>
);

const roleVariant = {
    Admin: 'default',
    Agent: 'secondary',
    Viewer: 'outline',
} as const;

export function TeamMemberDetailsDialog({
  member,
  isOpen,
  setIsOpen,
}: TeamMemberDetailsDialogProps) {

  if (!member) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader className="text-center items-center">
             <Avatar className="w-28 h-28 border-4 border-primary/20">
                <AvatarImage src={member.avatar} data-ai-hint="person portrait" />
                <AvatarFallback>{member.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex items-baseline gap-2 justify-center pt-4">
                <DialogTitle className="font-headline text-2xl">{member.name}</DialogTitle>
                <Badge variant={roleVariant[member.role]}>{member.role}</Badge>
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-6">
            <div className="space-y-6 py-4">

              <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-bold text-lg mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <DetailItem icon={<Phone />} label="Phone Number" value={member.phone} />
                      <DetailItem icon={<Mail />} label="Email Address" value={member.email} />
                  </div>
              </div>
              
              {member.stats && (
                <>
                    <Separator />
                    <div>
                        <h3 className="font-bold text-lg mb-4">Performance Stats</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <DetailItem icon={<HandCoins />} label="Properties Sold" value={member.stats.propertiesSold} />
                            <DetailItem icon={<Users />} label="Active Buyers" value={member.stats.activeBuyers} />
                            <DetailItem icon={<CalendarCheck />} label="Appointments Today" value={member.stats.appointmentsToday} />
                        </div>
                    </div>
                </>
              )}
               
              <Separator />

              <div>
                <h3 className="font-bold text-lg mb-4">Permissions</h3>
                 <div className="grid grid-cols-1 gap-6">
                    <DetailItem icon={<UserCog />} label="System Role" value={`${member.role} permissions apply.`} />
                 </div>
              </div>

            </div>
          </ScrollArea>
          <DialogFooter className="border-t pt-4">
             <Button variant="secondary" onClick={() => setIsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

    