
import { AddBuyerDialog } from '@/components/add-buyer-dialog';

export default function BuyersPage() {
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Buyers</h1>
        <p className="text-muted-foreground">Manage your buyer leads.</p>
      </div>
      <div className="fixed bottom-8 right-8 z-50">
        <AddBuyerDialog />
      </div>
    </>
  );
}
