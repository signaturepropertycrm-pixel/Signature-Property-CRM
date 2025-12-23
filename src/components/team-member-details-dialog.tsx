

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
import { Shield, User as UserIcon, Camera, PlayCircle, CheckCheck, VideoOff, Sigma } from 'lucide-react';
import { useMemo } from 'react';
import { Card, CardContent } from './ui/card';

interface TeamMemberDetailsDialogProps {
  member: User;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  properties: Property[];
}

const roleConfig: Record<string, { icon: React.ReactNode }> = {
    Admin: { icon: <Shield className="h-4 w-4" /> },
    Agent: { icon: <UserIcon className="h-4 w-4" /> },
    'Video Recorder': { icon: <Camera className="h-4 w-4" /> },
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: number}) => (
    <Card>
        <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-muted rounded-lg text-muted-foreground">{icon}</div>
            <div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
            </div>
        </CardContent>
    </Card>
);

export function TeamMemberDetailsDialog({
  member,
  isOpen,
  setIsOpen,
  properties,
}: TeamMemberDetailsDialogProps) {

    const videoRecorderStats = useMemo(() => {
        if (member.role !== 'Video Recorder') return null;

        const assignedProperties = properties.filter(p => p.assignedTo === member.id);
        const totalAssigned = assignedProperties.length;
        const pendingRecording = assignedProperties.filter(p => !p.is_recorded).length;
        const inEditing = assignedProperties.filter(p => p.is_recorded && p.editing_status === 'In Editing').length;
        const editingComplete = assignedProperties.filter(p => p.editing_status === 'Complete').length;

        return {
            totalAssigned,
            pendingRecording,
            inEditing,
            editingComplete
        };

    }, [member, properties]);

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

        <div className="py-4 space-y-4">
          {member.role === 'Video Recorder' && videoRecorderStats ? (
            <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 text-center">Performance Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                    <StatCard icon={<Sigma />} label="Total Assigned" value={videoRecorderStats.totalAssigned} />
                    <StatCard icon={<VideoOff />} label="Pending Recordings" value={videoRecorderStats.pendingRecording} />
                    <StatCard icon={<PlayCircle />} label="In Editing" value={videoRecorderStats.inEditing} />
                    <StatCard icon={<CheckCheck />} label="Editing Complete" value={videoRecorderStats.editingComplete} />
                </div>
            </div>
          ) : (
             <div className="py-4 text-center text-muted-foreground">
                <p>Performance statistics will be available in a future update.</p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button className="w-full" variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
