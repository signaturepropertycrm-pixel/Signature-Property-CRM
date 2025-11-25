
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
import { Shield, User as UserIcon } from 'lucide-react';
import { useMemo } from 'react';

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

        <div className="py-4 text-center text-muted-foreground">
            <p>Performance statistics will be available in a future update.</p>
        </div>

        <DialogFooter className="mt-4">
          <Button className="w-full" variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
