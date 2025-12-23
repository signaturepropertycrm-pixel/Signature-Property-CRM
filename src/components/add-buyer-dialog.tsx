

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
import { PlusCircle, AlertCircle } from 'lucide-react';
import type { Buyer } from '@/lib/types';
import { useEffect } from 'react';
import Link from 'next/link';
import { useProfile } from '@/context/profile-context';

interface AddBuyerDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    totalSaleBuyers: number;
    totalRentBuyers: number;
    buyerToEdit?: Buyer | null;
    onSave: (buyer: Omit<Buyer, 'id'>) => void;
    limitReached: boolean;
}

export function AddBuyerDialog({ 
    isOpen, 
    setIsOpen, 
    totalSaleBuyers, 
    totalRentBuyers,
    buyerToEdit, 
    onSave,
    limitReached,
}: AddBuyerDialogProps) {
    const { profile } = useProfile();

    if (limitReached && !buyerToEdit) {
        const isAgent = profile.role === 'Agent';
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><AlertCircle className="text-destructive" /> Limit Reached</DialogTitle>
                        <DialogDescription>
                            {isAgent 
                                ? "You have reached your personal limit for adding new buyers. You can still receive unlimited assigned leads from your agency."
                                : "You have reached your buyer limit for the current plan. To add more buyers, please upgrade your plan."
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                        {!isAgent && <Button asChild><Link href="/upgrade">Upgrade Plan</Link></Button>}
                    </div>
                </DialogContent>
            </Dialog>
        )
    }


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
