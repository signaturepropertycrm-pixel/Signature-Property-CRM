
'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Buyer, PriceUnit } from '@/lib/types';
import { formatCurrency, formatUnit, formatPhoneNumberForWhatsApp } from '@/lib/formatters';
import { useCurrency } from '@/context/currency-context';
import { Download, Share2 } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface FindBuyersByBudgetDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  buyers: Buyer[];
}

const formSchema = z.object({
  minBudget: z.coerce.number().min(0, 'Minimum budget must be positive'),
  maxBudget: z.coerce.number().min(0, 'Maximum budget must be positive'),
  budgetUnit: z.enum(['Lacs', 'Crore']).default('Lacs'),
});

type FormValues = z.infer<typeof formSchema>;

export function FindBuyersByBudgetDialog({
  isOpen,
  setIsOpen,
  buyers,
}: FindBuyersByBudgetDialogProps) {
  const [foundBuyers, setFoundBuyers] = useState<Buyer[]>([]);
  const { currency } = useCurrency();
  const [propertyMessage, setPropertyMessage] = useState('');
  const [isShareMode, setIsShareMode] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      minBudget: 0,
      maxBudget: 0,
      budgetUnit: 'Lacs',
    },
  });
  
  const formatBuyerBudget = (buyer: Buyer) => {
    if (!buyer.budget_min_amount || !buyer.budget_min_unit) return 'N/A';
    const minVal = formatUnit(buyer.budget_min_amount, buyer.budget_min_unit);

    if (!buyer.budget_max_amount || !buyer.budget_max_unit || (buyer.budget_min_amount === buyer.budget_max_amount && buyer.budget_min_unit === buyer.budget_max_unit)) {
      return formatCurrency(minVal, currency);
    }
    const maxVal = formatUnit(buyer.budget_max_amount, buyer.budget_max_unit);
    return `${formatCurrency(minVal, currency)} - ${formatCurrency(maxVal, currency)}`;
  }

  function onSubmit(values: FormValues) {
    const searchMin = formatUnit(values.minBudget, values.budgetUnit);
    const searchMax = formatUnit(values.maxBudget, values.budgetUnit);

    const filtered = buyers.filter(buyer => {
        if (!buyer.budget_min_amount || !buyer.budget_max_amount || !buyer.budget_min_unit || !buyer.budget_max_unit) {
            return false;
        }
        const buyerMin = formatUnit(buyer.budget_min_amount, buyer.budget_min_unit);
        const buyerMax = formatUnit(buyer.budget_max_amount, buyer.budget_max_unit);

        // Check for any overlap between buyer's range and search range
        return Math.max(searchMin, buyerMin) <= Math.min(searchMax, buyerMax);
    });

    setFoundBuyers(filtered);
    setIsShareMode(false);
  }

  const handleDownload = () => {
    const headers = ['Name', 'Phone', 'Budget', 'Area Preference'];
    const csvContent = [
      headers.join(','),
      ...foundBuyers.map(b => {
          const row = [
            `"${b.name}"`,
            `"${b.phone}"`,
            `"${formatBuyerBudget(b).replace(/,/g, '')}"`,
            `"${b.area_preference || 'N/A'}"`
          ];
          return row.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `budget-buyers-${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleShareToBuyer = (buyer: Buyer) => {
    const phone = formatPhoneNumberForWhatsApp(buyer.phone, buyer.country_code);
    const encodedMessage = encodeURIComponent(propertyMessage);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
    toast({ title: 'Redirecting to WhatsApp...', description: `Preparing message for ${buyer.name}`});
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Find Buyers by Budget</DialogTitle>
          <DialogDescription>
            Enter a budget range to find matching buyer leads.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-end gap-2">
              <FormField
                control={form.control}
                name="minBudget"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Min Budget</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxBudget"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Max Budget</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="budgetUnit"
                render={({ field }) => (
                  <FormItem className="w-28">
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Lacs">Lacs</SelectItem>
                            <SelectItem value="Crore">Crore</SelectItem>
                        </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <Button type="submit">Search</Button>
            </div>
          </form>
        </Form>
        {foundBuyers.length > 0 && (
          <div className="mt-6 space-y-4">
            <h4 className="font-semibold">Found {foundBuyers.length} Matching Buyers</h4>
            <ScrollArea className="h-64 border rounded-md">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Budget</TableHead>
                            <TableHead>Area</TableHead>
                            {isShareMode && <TableHead className="text-right">Action</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {foundBuyers.map(buyer => (
                            <TableRow key={buyer.id}>
                                <TableCell>{buyer.name}</TableCell>
                                <TableCell>{buyer.phone}</TableCell>
                                <TableCell>{formatBuyerBudget(buyer)}</TableCell>
                                <TableCell>{buyer.area_preference || 'N/A'}</TableCell>
                                {isShareMode && (
                                  <TableCell className="text-right">
                                    <Button size="sm" onClick={() => handleShareToBuyer(buyer)}>
                                      <Share2 className="mr-2 h-4 w-4" />
                                      Share
                                    </Button>
                                  </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
            </ScrollArea>
             <div className="flex justify-between items-center gap-2 pt-2">
                <Button variant="outline" onClick={handleDownload}><Download className="mr-2 h-4 w-4" /> Download List</Button>
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button><Share2 className="mr-2 h-4 w-4"/> Share Property to List</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Share Property Details</DialogTitle>
                            <DialogDescription>Paste the property details you want to share with the found buyers.</DialogDescription>
                        </DialogHeader>
                        <Textarea 
                            value={propertyMessage}
                            onChange={(e) => setPropertyMessage(e.target.value)}
                            rows={10}
                            placeholder="Paste property details here..."
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                             <DialogClose asChild>
                                <Button onClick={() => setIsShareMode(true)}>Set Message</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
          </div>
        )}
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
