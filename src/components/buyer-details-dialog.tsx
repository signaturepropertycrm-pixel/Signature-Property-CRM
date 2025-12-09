
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Buyer, PriceUnit, SizeUnit, User } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Home, Tag, Wallet, Ruler, Phone, Mail, FileText, CalendarDays, UserCheck, Check, UserPlus, Clock, History, Trash2 } from 'lucide-react';
import { useCurrency } from '@/context/currency-context';
import { formatCurrency, formatUnit } from '@/lib/formatters';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useFirestore } from '@/firebase/provider';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface BuyerDetailsDialogProps {
  buyer: Buyer;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeAgents?: User[];
  onAssign?: (buyer: Buyer, agentId: string | null) => void;
}

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 text-primary">{icon}</div>
        <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="font-semibold">{value || 'N/A'}</div>
        </div>
    </div>
);

const statusVariant = {
    'New': 'default',
    'Interested': 'default',
    'Not Interested': 'destructive',
    'Follow Up': 'default',
    'Visited Property': 'secondary',
    'Deal Closed': 'default',
} as const;

function formatSize(minAmount?: number, minUnit?: SizeUnit, maxAmount?: number, maxUnit?: SizeUnit) {
    if (!minAmount || !minUnit) {
        return 'N/A';
    }
     if (!maxAmount || !maxUnit || (minAmount === maxAmount && minUnit === maxUnit)) {
        return `${minAmount} ${minUnit}`;
    }
    return `${minAmount} - ${maxAmount} ${maxUnit}`;
}


export function BuyerDetailsDialog({
  buyer,
  isOpen,
  setIsOpen,
  activeAgents = [],
  onAssign = () => {},
}: BuyerDetailsDialogProps) {
  const { currency } = useCurrency();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();


  const formatBudget = (minAmount?: number, minUnit?: PriceUnit, maxAmount?: number, maxUnit?: PriceUnit) => {
    if (!minAmount || !minUnit) {
      return 'N/A';
    }
    const minVal = formatUnit(minAmount, minUnit);

    if (!maxAmount || !maxUnit || (minAmount === maxAmount && minUnit === maxUnit)) {
      return formatCurrency(minVal, currency);
    }
    const maxVal = formatUnit(maxAmount, maxUnit);
    return `${formatCurrency(minVal, currency)} - ${formatCurrency(maxVal, currency)}`;
  };
  
  const assignedAgentName = useMemo(() => {
    if (!buyer.assignedTo) return 'Unassigned';
    return activeAgents.find(agent => agent.id === buyer.assignedTo)?.name || 'Unknown Agent';
  }, [buyer.assignedTo, activeAgents]);

  const handleClearHistory = async () => {
    if (!buyer.agency_id) return;
    try {
        const buyerRef = doc(firestore, 'agencies', buyer.agency_id, 'buyers', buyer.id);
        await updateDoc(buyerRef, {
            sharedProperties: []
        });
        toast({ title: "History Cleared", description: "The shared properties history has been cleared." });
    } catch (error) {
        console.error("Failed to clear history:", error);
        toast({ title: "Error", description: "Could not clear history.", variant: "destructive" });
    }
  };


  if (!buyer) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="font-headline text-2xl">{buyer.name}</DialogTitle>
                <DialogDescription asChild>
                    <div className="flex items-center gap-2 text-xs">
                        <Badge variant="default" className="font-mono bg-primary/20 text-primary hover:bg-primary/30">{buyer.serial_no}</Badge>
                        <span className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3" /> {new Date(buyer.created_at).toLocaleDateString()}</span>
                    </div>
                </DialogDescription>
              </div>
               <div className="flex items-center gap-2">
                {buyer.is_investor && (
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white">Investor</Badge>
                )}
                <Badge 
                        variant={buyer.status === 'Follow Up' ? 'default' : statusVariant[buyer.status as keyof typeof statusVariant]} 
                        className={
                            `capitalize ${buyer.status === 'Interested' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 
                            buyer.status === 'New' ? 'bg-green-600 hover:bg-green-700 text-white' :
                            buyer.status === 'Not Interested' ? 'bg-red-600 hover:bg-red-700 text-white' :
                            buyer.status === 'Deal Closed' ? 'bg-slate-800 hover:bg-slate-900 text-white' : ''}`
                        }
                    >
                        {buyer.status}
                    </Badge>
               </div>
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-6">
            <div className="space-y-6 py-4">

              <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-bold text-lg mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <DetailItem icon={<Phone />} label="Phone Number" value={buyer.phone} />
                      <DetailItem icon={<Mail />} label="Email Address" value={buyer.email} />
                  </div>
              </div>
              
              <Separator />

              <div>
                  <h3 className="font-bold text-lg mb-4">Buyer Requirements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DetailItem icon={<Home />} label="Area Preference" value={buyer.area_preference} />
                    <DetailItem icon={<Tag />} label="Property Type" value={buyer.property_type_preference} />
                    <DetailItem icon={<Wallet />} label="Budget" value={formatBudget(buyer.budget_min_amount, buyer.budget_min_unit, buyer.budget_max_amount, buyer.budget_max_unit)} />
                    <DetailItem icon={<Ruler />} label="Size" value={formatSize(buyer.size_min_value, buyer.size_min_unit, buyer.size_max_value, buyer.size_max_unit)} />
                  </div>
              </div>
               
              <Separator />

              <div>
                <h3 className="font-bold text-lg mb-4">Additional Notes</h3>
                 <div className="grid grid-cols-1 gap-6">
                    <DetailItem icon={<FileText />} label="Notes / Other Requirements" value={<p className="whitespace-pre-wrap">{buyer.notes || 'No notes provided.'}</p>} />
                 </div>
              </div>

               {buyer.sharedProperties && buyer.sharedProperties.length > 0 && (
                <>
                    <Separator />
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2"><History/> Shared Properties History</h3>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Clear History
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently clear the shared property history for this buyer. This action cannot be undone.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleClearHistory}>Confirm & Clear</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Property</TableHead>
                                        <TableHead>Serial No</TableHead>
                                        <TableHead className="text-right">Shared On</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {buyer.sharedProperties.sort((a,b) => new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime()).map((prop, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{prop.propertyTitle}</TableCell>
                                            <TableCell><Badge variant="outline">{prop.propertySerialNo}</Badge></TableCell>
                                            <TableCell className="text-right">{new Date(prop.sharedAt).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </>
               )}

            </div>
          </ScrollArea>
          <DialogFooter className="border-t pt-4 sm:justify-between">
            <div className="flex items-center gap-2">
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline"><UserPlus className="mr-2 h-4 w-4" />Assign Agent</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-0">
                         <Command>
                            <CommandInput placeholder="Search agents..." />
                            <CommandList>
                                <CommandEmpty>No agents found.</CommandEmpty>
                                <CommandGroup>
                                    {buyer.assignedTo && (
                                        <CommandItem key="unassign-agent" onSelect={() => { onAssign(buyer, null); setPopoverOpen(false); }}>
                                            Unassign
                                        </CommandItem>
                                    )}
                                    {activeAgents.map(agent => (
                                        <CommandItem key={agent.id} onSelect={() => { onAssign(buyer, agent.id); setPopoverOpen(false); }} disabled={buyer.assignedTo === agent.id}>
                                            <Check className={buyer.assignedTo === agent.id ? 'mr-2 h-4 w-4 opacity-100' : 'mr-2 h-4 w-4 opacity-0'} />
                                            {agent.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                {buyer.assignedTo && <Badge variant="secondary" className="text-sm">{assignedAgentName}</Badge>}
            </div>
             <Button variant="secondary" onClick={() => setIsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
