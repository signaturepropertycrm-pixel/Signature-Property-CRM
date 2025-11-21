
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AddTeamMemberForm } from './add-team-member-form';
import type { User } from '@/lib/types';
import { useEffect } from 'react';

interface AddTeamMemberDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  memberToEdit?: User | null;
}

export function AddTeamMemberDialog({ isOpen, setIsOpen, memberToEdit }: AddTeamMemberDialogProps) {

  useEffect(() => {
    if (!isOpen) {
      // Optional: Logic to clear form state when dialog closes
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">
            {memberToEdit ? 'Edit Team Member' : 'Add New Team Member'}
          </DialogTitle>
          <DialogDescription>
            {memberToEdit ? "Update the member's details below." : 'Fill in the details to invite a new member to your agency.'}
          </DialogDescription>
        </DialogHeader>
        <AddTeamMemberForm setDialogOpen={setIsOpen} memberToEdit={memberToEdit} />
      </DialogContent>
    </Dialog>
  );
}
