
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
import { AddBuyerForm } from './add-buyer-form';
import { Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function AddBuyerDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-full w-14 h-14 shadow-lg">
              <Plus className="h-6 w-6" />
              <span className="sr-only">Add Buyer</span>
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">Add Buyer</TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Add New Buyer</DialogTitle>
          <DialogDescription>
            Fill in the details for the new buyer lead.
          </DialogDescription>
        </DialogHeader>
        <AddBuyerForm setDialogOpen={setIsOpen} />
      </DialogContent>
    </Dialog>
  );
}
