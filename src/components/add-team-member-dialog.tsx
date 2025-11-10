
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { User } from '@/lib/types';
import { AddTeamMemberForm } from './add-team-member-form';

interface AddTeamMemberDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  memberToEdit: User | null;
  onSave: (member: User) => void;
}

export function AddTeamMemberDialog({ isOpen, setIsOpen, memberToEdit, onSave }: AddTeamMemberDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">{memberToEdit ? 'Edit Team Member' : 'Add New Team Member'}</DialogTitle>
          <DialogDescription>
            {memberToEdit ? 'Update the details for this team member.' : 'Fill in the details for the new team member.'}
          </DialogDescription>
        </DialogHeader>
        <AddTeamMemberForm 
            setDialogOpen={setIsOpen} 
            memberToEdit={memberToEdit} 
            onSave={onSave} 
        />
      </DialogContent>
    </Dialog>
  );
}

    