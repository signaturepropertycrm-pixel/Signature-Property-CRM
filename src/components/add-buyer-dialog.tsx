
'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AddBuyerForm } from './add-buyer-form';
import { PlusCircle } from 'lucide-react';

interface AddBuyerDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    totalBuyers: number;
}

export function AddBuyerDialog({ isOpen, setIsOpen, totalBuyers }: AddBuyerDialogProps) {

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Add New Buyer</DialogTitle>
          <DialogDescription>
            Fill in the details for the new buyer lead.
          </DialogDescription>
        </DialogHeader>
        <AddBuyerForm setDialogOpen={setIsOpen} totalBuyers={totalBuyers} />
      </DialogContent>
    </Dialog>
  );
}

    