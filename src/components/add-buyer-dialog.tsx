
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
import type { Buyer } from '@/lib/types';
import { useEffect } from 'react';

interface AddBuyerDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    totalSaleBuyers: number;
    totalRentBuyers: number;
    buyerToEdit?: Buyer | null;
    onSave: (buyer: Omit<Buyer, 'id'>) => void;
}

export function AddBuyerDialog({ 
    isOpen, 
    setIsOpen, 
    totalSaleBuyers, 
    totalRentBuyers,
    buyerToEdit, 
    onSave 
}: AddBuyerDialogProps) {

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-headline">{buyerToEdit ? 'Edit Buyer' : 'Add New Buyer'}</DialogTitle>
          <DialogDescription>
            {buyerToEdit ? 'Update the details for this buyer.' : 'Fill in the details for the new buyer lead.'}
          </DialogDescription>
        </DialogHeader>
        <AddBuyerForm 
            setDialogOpen={setIsOpen} 
            totalSaleBuyers={totalSaleBuyers} 
            totalRentBuyers={totalRentBuyers} 
            buyerToEdit={buyerToEdit} 
            onSave={onSave} 
        />
      </DialogContent>
    </Dialog>
  );
}
