
'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Download, Share2, Check, Phone, Wallet, Home, DollarSign } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { useProfile } from '@/context/profile-context';
import { useMemoFirebase } from '@/firebase/hooks';


interface FindBuyersByBudgetDialogProps {
  buyers: Buyer[];
}

const formSchema = z.object({
  minBudget: z.coerce.number().min(0, 'Minimum budget must be positive'),
  maxBudget: z.coerce.number().min(0, 'Maximum budget must be positive'),
  budgetUnit: z.enum(['Lacs', 'Crore']).default('Lacs'),
});

type FormValues = z.infer<typeof formSchema>;
type ShareStatus = 'idle' | 'confirming' | 'shared';

export default function DealTrackerPage() {
  const [foundBuyers, setFoundBuyers] = useState<Buyer[]>([]);
  const { currency } = useCurrency();
  const [propertyMessage, setPropertyMessage] = useState('');
  const [isShareMode, setIsShareMode] = useState(false);
  const { toast } = useToast();
  const [shareStatus, setShareStatus] = useState<Record<string, ShareStatus>>({});
  const isMobile = useIsMobile();
  const { profile } = useProfile();
  const firestore = useFirestore();

  const buyersQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'buyers') : null, [profile.agency_id, firestore]);
  const { data: buyers, isLoading } = useCollection<Buyer>(buyersQuery);

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

    const filtered = (buyers || []).filter(buyer => {
        if (!buyer.budget_min_amount || !buyer.budget_max_amount || !buyer.budget_min_unit || !buyer.budget_max_unit) {
            return false;
        }
        const buyerMin = formatUnit(buyer.budget_min_amount, buyer.budget_min_unit);
        const buyerMax = formatUnit(buyer.budget_max_amount, buyer.budget_max_unit);

        return Math.max(searchMin, buyerMin) <= Math.min(searchMax, buyerMax);
    });

    setFoundBuyers(filtered);
    // Initialize share status for found buyers
    const initialStatus: Record<string, ShareStatus> = {};
    filtered.forEach(buyer => {
      initialStatus[buyer.id] = 'idle';
    });
    setShareStatus(initialStatus);
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
    toast({ title: 'Redirecting to WhatsApp...', description: `Confirm share for ${buyer.name} upon return.`});
    setShareStatus(prev => ({...prev, [buyer.id]: 'confirming'}));
  };
  
  const handleConfirmShare = (buyerId: string, confirmed: boolean) => {
    setShareStatus(prev => ({ ...prev, [buyerId]: confirmed ? 'shared' : 'idle' }));
  };

  const renderCards = () => (
    <div className="p-4 space-y-4">
      {foundBuyers.map((buyer, index) => (
        <Card key={buyer.id}>
          <CardHeader>
            <CardTitle className="flex justify-between items-start">
              <span>{index + 1}. {buyer.name}</span>
              <Badge variant="outline">{buyer.serial_no}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {buyer.phone}</div>
            <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-muted-foreground" /> {formatBuyerBudget(buyer)}</div>
            <div className="flex items-center gap-2"><Home className="h-4 w-4 text-muted-foreground" /> {buyer.area_preference || 'N/A'}</div>
          </CardContent>
          {isShareMode && (
            <CardFooter className="justify-end">
              {shareStatus[buyer.id] === 'idle' && (
                <Button size="sm" onClick={() => handleShareToBuyer(buyer)}>
                  <Share2 className="mr-2 h-4 w-4" /> Share
                </Button>
              )}
              {shareStatus[buyer.id] === 'confirming' && (
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="destructive" onClick={() => handleConfirmShare(buyer.id, false)}>No</Button>
                  <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleConfirmShare(buyer.id, true)}>Yes</Button>
                </div>
              )}
              {shareStatus[buyer.id] === 'shared' && (
                <div className="flex items-center justify-end gap-2 text-green-600 font-bold">
                  <Check className="h-5 w-5" /> Shared
                </div>
              )}
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );

  const renderTable = () => (
      <Table>
          <TableHeader>
              <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Area</TableHead>
                  {isShareMode && <TableHead className="text-right">Action</TableHead>}
              </TableRow>
          </TableHeader>
          <TableBody>
              {foundBuyers.map((buyer, index) => (
                  <TableRow key={buyer.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{buyer.name}</TableCell>
                      <TableCell>{buyer.phone}</TableCell>
                      <TableCell>{formatBuyerBudget(buyer)}</TableCell>
                      <TableCell>{buyer.area_preference || 'N/A'}</TableCell>
                      {isShareMode && (
                        <TableCell className="text-right">
                          {shareStatus[buyer.id] === 'idle' && (
                            <Button size="sm" onClick={() => handleShareToBuyer(buyer)}>
                              <Share2 className="mr-2 h-4 w-4" /> Share
                            </Button>
                          )}
                          {shareStatus[buyer.id] === 'confirming' && (
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="destructive" onClick={() => handleConfirmShare(buyer.id, false)}>No</Button>
                              <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleConfirmShare(buyer.id, true)}>Yes</Button>
                            </div>
                          )}
                          {shareStatus[buyer.id] === 'shared' && (
                            <div className="flex items-center justify-end gap-2 text-green-600 font-bold">
                              <Check className="h-5 w-5" /> Shared
                            </div>
                          )}
                        </TableCell>
                      )}
                  </TableRow>
              ))}
          </TableBody>
      </Table>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2"><DollarSign/> Deal Tracker</h1>
        <p className="text-muted-foreground">
          Find buyers by budget to quickly match them with properties.
        </p>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Find Buyers</CardTitle>
            <CardDescription>Enter a budget range to find matching buyer leads.</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
        {foundBuyers.length > 0 && (
          <div className="mt-6 space-y-4 p-6 border-t">
            <h4 className="font-semibold">Found {foundBuyers.length} Matching Buyers</h4>
            <ScrollArea className="h-64 border rounded-md">
                {isMobile ? renderCards() : renderTable()}
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
      </Card>
    </div>
  );
}

