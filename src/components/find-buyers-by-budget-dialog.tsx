
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
import { formatCurrency, formatUnit } from '@/lib/formatters';
import { useCurrency } from '@/context/currency-context';

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
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-xl">
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
          <div className="mt-6 space-y-2">
            <h4 className="font-semibold">Found {foundBuyers.length} Matching Buyers</h4>
            <ScrollArea className="h-64 border rounded-md">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Budget</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {foundBuyers.map(buyer => (
                            <TableRow key={buyer.id}>
                                <TableCell>{buyer.name}</TableCell>
                                <TableCell>{buyer.phone}</TableCell>
                                <TableCell>{formatBuyerBudget(buyer)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
            </ScrollArea>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
