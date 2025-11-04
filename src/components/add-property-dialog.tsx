'use client';
import { useState } from 'react';
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

export function AddPropertyDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    Dialog open={isOpen} onOpenChange={setIsOpen}>
      DialogTrigger asChild>
        Button>
          PlusCircle className="mr-2 h-4 w-4" /> Add Property
        Button>
      DialogTrigger>
      DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        DialogHeader>
          DialogTitle className="font-headline">Add New PropertyDialogTitle>
          DialogDescription>
            Fill in the details below to add a new property to the system.
          DialogDescription>
        DialogHeader>
        AddPropertyForm setDialogOpen={setIsOpen} />
      DialogContent>
    Dialog>
  );
}
