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
import { AddSalePropertyForm } from './add-sale-property-form';
import { AddRentPropertyForm } from './add-rent-property-form';
import { PlusCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import type { Property, ListingType } from '@/lib/types';
import { useEffect } from 'react';

interface AddPropertyDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onSave: (property: Omit<Property, 'id'> & { id?: string }) => void;
    propertyToEdit: Property | null;
    totalProperties: number;
    listingType: ListingType;
}

export function AddPropertyDialog({ isOpen, setIsOpen, onSave, propertyToEdit, totalProperties, listingType }: AddPropertyDialogProps) {

    useEffect(() => {
        if (!isOpen) {
            // clear propertyToEdit when dialog is closed
        }
    }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline">{propertyToEdit ? 'Edit Property' : `Add New Property ${listingType}`}</DialogTitle>
          <DialogDescription>
            {propertyToEdit ? 'Update the details for this property.' : `Fill in the details to add a new property ${listingType.toLowerCase()}.`}
          </DialogDescription>
        </DialogHeader>
        {listingType === 'For Sale' ? (
          <AddSalePropertyForm setDialogOpen={setIsOpen} onSave={onSave} propertyToEdit={propertyToEdit} totalProperties={totalProperties} />
        ) : (
          <AddRentPropertyForm setDialogOpen={setIsOpen} onSave={onSave} propertyToEdit={propertyToEdit} totalProperties={totalProperties} />
        )}
      </DialogContent>
    </Dialog>
  );
}
