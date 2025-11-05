
'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddPropertyForm } from './add-property-form';
import { PlusCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import type { Property } from '@/lib/types';
import { useEffect } from 'react';

interface AddPropertyDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    propertyToEdit: Property | null;
    totalProperties: number;
}

export function AddPropertyDialog({ isOpen, setIsOpen, propertyToEdit, totalProperties }: AddPropertyDialogProps) {

    useEffect(() => {
        if (!isOpen) {
            // clear propertyToEdit when dialog is closed
        }
    }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline">{propertyToEdit ? 'Edit Property' : 'Add New Property'}</DialogTitle>
          <DialogDescription>
            {propertyToEdit ? 'Update the details for this property.' : 'Fill in the details to add a new property.'}
          </DialogDescription>
        </DialogHeader>
        <AddPropertyForm setDialogOpen={setIsOpen} propertyToEdit={propertyToEdit} totalProperties={totalProperties} />
      </DialogContent>
    </Dialog>
  );
}

    