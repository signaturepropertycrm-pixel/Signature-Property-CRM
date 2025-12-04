

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
import { PlusCircle, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import type { Property, ListingType } from '@/lib/types';
import { useEffect, useMemo } from 'react';
import Link from 'next/link';

interface AddPropertyDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onSave: (property: Omit<Property, 'id'> & { id?: string }) => void;
    propertyToEdit: Property | null;
    allProperties: Property[]; // Changed from totalProperties to allProperties
    listingType: ListingType;
    limitReached: boolean;
}

export function AddPropertyDialog({ isOpen, setIsOpen, onSave, propertyToEdit, allProperties, listingType, limitReached }: AddPropertyDialogProps) {

    const totalSaleProperties = useMemo(() => {
        return allProperties.filter(p => p.listing_type === 'For Sale').length;
    }, [allProperties]);

    const totalRentProperties = useMemo(() => {
        return allProperties.filter(p => p.listing_type === 'For Rent').length;
    }, [allProperties]);


    useEffect(() => {
        if (!isOpen) {
            // clear propertyToEdit when dialog is closed
        }
    }, [isOpen]);
    
    if (limitReached && !propertyToEdit) {
        return (
             <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><AlertCircle className="text-destructive" /> Limit Reached</DialogTitle>
                        <DialogDescription>
                            You have reached your property limit for the current plan. To add more properties, please upgrade your plan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button asChild><Link href="/upgrade">Upgrade Plan</Link></Button>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline">{propertyToEdit ? 'Edit Property' : `Add New Property ${listingType}`}</DialogTitle>
          <DialogDescription>
            {propertyToEdit ? 'Update the details for this property.' : `Fill in the details to add a new property ${listingType ? listingType.toLowerCase() : ''}.`}
          </DialogDescription>
        </DialogHeader>
        {listingType === 'For Sale' ? (
          <AddSalePropertyForm setDialogOpen={setIsOpen} onSave={onSave} propertyToEdit={propertyToEdit} totalProperties={totalSaleProperties} />
        ) : (
          <AddRentPropertyForm setDialogOpen={setIsOpen} onSave={onSave} propertyToEdit={propertyToEdit} totalProperties={totalRentProperties} />
        )}
      </DialogContent>
    </Dialog>
  );
}
