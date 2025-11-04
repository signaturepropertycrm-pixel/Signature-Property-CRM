
'use client';
import { AddBuyerDialog } from '@/components/add-buyer-dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';

export default function BuyersPage() {
    const [isAddBuyerOpen, setIsAddBuyerOpen] = useState(false);
  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Buyers</h1>
            <p className="text-muted-foreground">Manage your buyer leads.</p>
          </div>
        </div>
         <div className="flex items-center justify-center text-center h-96 border-2 border-dashed rounded-2xl">
            <div className="space-y-2">
                <p className="text-muted-foreground">Buyer management interface coming soon.</p>
                <Button onClick={() => setIsAddBuyerOpen(true)}>Add your first buyer</Button>
            </div>
        </div>
      </div>
      <div className="fixed bottom-8 right-8 z-50">
         <AddBuyerDialog isOpen={isAddBuyerOpen} setIsOpen={setIsAddBuyerOpen} />
      </div>
    </>
  );
}
