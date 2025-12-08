
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
import { Buyer, PriceUnit, Property } from '@/lib/types';
import { formatCurrency, formatUnit, formatPhoneNumberForWhatsApp } from '@/lib/formatters';
import { useCurrency } from '@/context/currency-context';
import { Download, Share2, Check, Phone, Wallet, Home, DollarSign, FileText, Video } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-is-mobile';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';


interface FindBuyersByBudgetDialogProps {
  buyers: Buyer[];
}

const formSchema = z.object({
  minBudget: z.coerce.number().min(0, 'Minimum budget must be positive').optional(),
  maxBudget: z.coerce.number().min(0, 'Maximum budget must be positive').optional(),
  budgetUnit: z.enum(['Lacs', 'Crore']).default('Lacs'),
  area: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
type ShareStatus = 'idle' | 'confirming' | 'shared';
type VideoLinkPlatform = 'tiktok' | 'youtube' | 'instagram' | 'facebook' | 'other';


export default function FindByBudgetPage() {
  const [foundBuyers, setFoundBuyers] = useState<Buyer[]>([]);
  const { currency } = useCurrency();
  const [propertyMessage, setPropertyMessage] = useState('');
  const [isShareMode, setIsShareMode] = useState(false);
  const { toast } = useToast();
  const [shareStatus, setShareStatus] = useState<Record<string, ShareStatus>>({});
  const isMobile = useIsMobile();
  const { profile } = useProfile();
  const firestore = useFirestore();

  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  // Fetch all properties for the new "From Property" tab
  const propertiesQuery = useMemoFirebase(
    () => (profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'properties') : null),
    [profile.agency_id, firestore]
  );
  const { data: allProperties } = useCollection<Property>(propertiesQuery);

  const buyersQuery = useMemoFirebase(
    () => (profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'buyers') : null),
    [profile.agency_id, firestore]
  );
  const { data: buyers, isLoading } = useCollection<Buyer>(buyersQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      minBudget: 0,
      maxBudget: 0,
      budgetUnit: 'Lacs',
      area: '',
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
    if (!values.area && (!values.minBudget || !values.maxBudget)) {
        toast({ title: 'Invalid Search', description: 'Please provide a budget range or an area to search.', variant: 'destructive'});
        return;
    }

    const searchMin = values.minBudget ? formatUnit(values.minBudget, values.budgetUnit) : 0;
    const searchMax = values.maxBudget ? formatUnit(values.maxBudget, values.budgetUnit) : Infinity;

    const filtered = (buyers || []).filter(buyer => {
        let budgetMatch = true;
        if (searchMin > 0 || searchMax < Infinity) {
            if (!buyer.budget_min_amount || !buyer.budget_max_amount || !buyer.budget_min_unit || !buyer.budget_max_unit) {
                budgetMatch = false;
            } else {
                const buyerMin = formatUnit(buyer.budget_min_amount, buyer.budget_min_unit);
                const buyerMax = formatUnit(buyer.budget_max_amount, buyer.budget_max_unit);
                budgetMatch = Math.max(searchMin, buyerMin) <= Math.min(searchMax, buyerMax);
            }
        }
        
        const areaMatch = !values.area || (buyer.area_preference && buyer.area_preference.toLowerCase().includes(values.area.toLowerCase()));

        return budgetMatch && areaMatch;
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
    const headers = ['Name', 'Phone', 'Budget', 'Area Preference', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...foundBuyers.map(b => {
          const row = [
            `"${b.name}"`,
            `"${b.phone}"`,
            `"${formatBuyerBudget(b).replace(/,/g, '')}"`,
            `"${b.area_preference || 'N/A'}"`,
            `"${(b.notes || '').replace(/"/g, '""')}"`
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
            <div className="flex items-start gap-2"><FileText className="h-4 w-4 text-muted-foreground mt-1" /> <p className="whitespace-pre-wrap">{buyer.notes || 'No notes.'}</p></div>
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
                  <span className="text-sm text-muted-foreground">Shared?</span>
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
                  <TableHead>Notes</TableHead>
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
                      <TableCell className="max-w-xs truncate">{buyer.notes || 'N/A'}</TableCell>
                      {isShareMode && (
                        <TableCell className="text-right">
                          {shareStatus[buyer.id] === 'idle' && (
                            <Button size="sm" onClick={() => handleShareToBuyer(buyer)}>
                              <Share2 className="mr-2 h-4 w-4" /> Share
                            </Button>
                          )}
                          {shareStatus[buyer.id] === 'confirming' && (
                             <div className="flex gap-2 justify-end items-center">
                              <span className="text-sm text-muted-foreground">Shared?</span>
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
    <>
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2"><DollarSign/> Find By Budget</h1>
        <p className="text-muted-foreground">
          Find buyers by budget and area to quickly match them with properties.
        </p>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Find Buyers</CardTitle>
            <CardDescription>Enter a budget range and/or an area to find matching buyer leads.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-end gap-2 lg:col-span-2">
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
                  </div>
                  <FormField
                      control={form.control}
                      name="area"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Area Preference</FormLabel>
                          <FormControl>
                          <Input {...field} placeholder="e.g. DHA, Bahria" />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                </div>
                <div className="flex justify-end">
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
                <Button onClick={() => setIsShareDialogOpen(true)}><Share2 className="mr-2 h-4 w-4"/> Share Detail</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
    <ShareDetailsDialog 
        isOpen={isShareDialogOpen} 
        setIsOpen={setIsShareDialogOpen}
        onSetMessage={setPropertyMessage}
        startSharing={() => setIsShareMode(true)}
        allProperties={allProperties || []}
        currency={currency}
    />
    </>
  );
}

// Share Dialog Component
interface ShareDetailsDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onSetMessage: (message: string) => void;
    startSharing: () => void;
    allProperties: Property[];
    currency: string;
}

function ShareDetailsDialog({ isOpen, setIsOpen, onSetMessage, startSharing, allProperties, currency }: ShareDetailsDialogProps) {
    const [activeTab, setActiveTab] = useState('custom');
    const [customMessage, setCustomMessage] = useState('');
    const [propertySearch, setPropertySearch] = useState('');
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [generatedMessage, setGeneratedMessage] = useState('');
    const [selectedLinks, setSelectedLinks] = useState<Record<VideoLinkPlatform, boolean>>({});

    const filteredProperties = useMemo(() => {
        if (!propertySearch) return [];
        const lowerQuery = propertySearch.toLowerCase();
        return allProperties.filter(p => 
            p.serial_no.toLowerCase().includes(lowerQuery) ||
            p.auto_title.toLowerCase().includes(lowerQuery) ||
            p.area.toLowerCase().includes(lowerQuery)
        ).slice(0, 10);
    }, [propertySearch, allProperties]);
    
    const availableLinks = useMemo(() => {
        if (!selectedProperty?.is_recorded || !selectedProperty.video_links) return [];
        return (Object.keys(selectedProperty.video_links) as VideoLinkPlatform[]).filter(key => !!selectedProperty.video_links![key]);
    }, [selectedProperty]);

    useEffect(() => {
        if (selectedProperty) {
            const initialSelected: Record<VideoLinkPlatform, boolean> = {};
            availableLinks.forEach(link => initialSelected[link] = true);
            setSelectedLinks(initialSelected);
        }
    }, [selectedProperty, availableLinks]);

    useEffect(() => {
        if (selectedProperty) {
             const linksToShare = Object.entries(selectedLinks)
                .filter(([_, isSelected]) => isSelected)
                .map(([platform]) => {
                    const link = selectedProperty.video_links?.[platform as VideoLinkPlatform];
                    return link ? `${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${link}` : null;
                })
                .filter(Boolean)
                .join('\n');

            const videoLinksSection = linksToShare ? `\n*Video Links:*\n${linksToShare}` : '';

            const details = `*PROPERTY DETAILS* 🏡\nSerial No: ${selectedProperty.serial_no}\nArea: ${selectedProperty.area}\nType: ${selectedProperty.property_type}\nSize: ${selectedProperty.size_value} ${selectedProperty.size_unit}\nDemand: ${selectedProperty.demand_amount} ${selectedProperty.demand_unit}${videoLinksSection}`;
            setGeneratedMessage(details);
        }
    }, [selectedProperty, selectedLinks]);
    

    const handleSetMessage = () => {
        const messageToSet = activeTab === 'custom' ? customMessage : generatedMessage;
        onSetMessage(messageToSet);
        startSharing();
        setIsOpen(false);
    }
    
     const handleLinkSelectionChange = (platform: VideoLinkPlatform) => {
        setSelectedLinks(prev => ({ ...prev, [platform]: !prev[platform] }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Share Property Details</DialogTitle>
                    <DialogDescription>Create a message to share with the found buyers.</DialogDescription>
                </DialogHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="custom">Custom Message</TabsTrigger>
                        <TabsTrigger value="property">From Property</TabsTrigger>
                    </TabsList>
                    <TabsContent value="custom" className="mt-4">
                        <Textarea 
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            rows={10}
                            placeholder="Type your custom message here..."
                        />
                    </TabsContent>
                    <TabsContent value="property" className="mt-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="prop-search">Search Property (by SN, Title, Area)</Label>
                            <Input id="prop-search" value={propertySearch} onChange={(e) => setPropertySearch(e.target.value)} />
                        </div>
                        {propertySearch && (
                            <ScrollArea className="h-40 border rounded-md">
                                <Command>
                                    <CommandList>
                                        <CommandEmpty>No properties found.</CommandEmpty>
                                        {filteredProperties.map(prop => (
                                            <CommandItem key={prop.id} onSelect={() => { setSelectedProperty(prop); setPropertySearch(''); }}>
                                                {prop.auto_title} ({prop.serial_no})
                                            </CommandItem>
                                        ))}
                                    </CommandList>
                                </Command>
                            </ScrollArea>
                        )}
                        {selectedProperty && (
                             <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                                <p><span className="font-semibold">Selected:</span> {selectedProperty.auto_title} ({selectedProperty.serial_no})</p>
                                {availableLinks.length > 0 && (
                                    <div>
                                        <Label className="font-semibold flex items-center gap-2 mb-2"><Video className="h-4 w-4" /> Include Video Links</Label>
                                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                                            {availableLinks.map(platform => (
                                                <div key={platform} className="flex items-center space-x-2">
                                                    <Checkbox 
                                                        id={`share-${platform}`}
                                                        checked={selectedLinks[platform]}
                                                        onCheckedChange={() => handleLinkSelectionChange(platform)}
                                                    />
                                                    <Label htmlFor={`share-${platform}`} className="text-sm font-normal capitalize cursor-pointer">
                                                        {platform}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <Textarea readOnly value={generatedMessage} rows={8} />
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSetMessage}>Set Message & Start Sharing</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


