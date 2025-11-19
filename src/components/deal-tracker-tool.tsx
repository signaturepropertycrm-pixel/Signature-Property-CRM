
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';
import { useCurrency } from '@/context/currency-context';
import { Calculator } from 'lucide-react';
import { User } from '@/lib/types';
import { add } from 'date-fns';

const dealStatuses = ['In Negotiation', 'Finalized', 'Closed'] as const;

const formSchema = z.object({
  propertyTitle: z.string().min(1, 'Property title is required'),
  buyerName: z.string().min(1, 'Buyer name is required'),
  dealStatus: z.enum(dealStatuses),
  propertyPrice: z.coerce.number().positive('Price must be a positive number'),
  commissionPercentage: z.coerce.number().min(0).max(100, 'Percentage must be between 0 and 100'),
  agentName: z.string().min(1, 'Agent name is required'),
  closingDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid date' }),
});

type DealFormValues = z.infer<typeof formSchema>;

type DealSummary = {
    commissionAmount: string;
    expectedPaymentDate: string;
    summary: string;
    nextAction: string;
}

export function DealTrackerTool() {
  const { currency } = useCurrency();
  const [dealSummary, setDealSummary] = useState<DealSummary | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);

  useEffect(() => {
      const savedTeamMembers = localStorage.getItem('teamMembers');
      if (savedTeamMembers) {
          setTeamMembers(JSON.parse(savedTeamMembers));
      }
  }, []);

  const form = useForm<DealFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dealStatus: 'In Negotiation',
      agentName: '',
      closingDate: new Date().toISOString().split('T')[0],
    },
  });

  const agentNames = teamMembers.filter(m => m.role === 'Agent' || m.role === 'Admin').map(m => m.name);

  function onSubmit(values: DealFormValues) {
    const commission = (values.propertyPrice * values.commissionPercentage) / 100;
    const paymentDate = add(new Date(values.closingDate), { days: 7 });

    let summary = `Deal for "${values.propertyTitle}" with ${values.buyerName} is currently ${values.dealStatus}.`;
    let nextAction = '';

    switch (values.dealStatus) {
        case 'In Negotiation':
            summary += ` The agent, ${values.agentName}, is negotiating the final price.`;
            nextAction = 'Follow up with agent for status update.';
            break;
        case 'Finalized':
            summary += ` The deal is finalized at a price of ${formatCurrency(values.propertyPrice, currency)}.`;
            nextAction = 'Collect all necessary documents from buyer and seller.';
            break;
        case 'Closed':
            summary += ` The deal was successfully closed on ${new Date(values.closingDate).toLocaleDateString()}.`;
            nextAction = `Receive commission payment by ${paymentDate.toLocaleDateString()}.`;
            break;
    }

    setDealSummary({
        commissionAmount: formatCurrency(commission, currency),
        expectedPaymentDate: paymentDate.toLocaleDateString(),
        summary,
        nextAction,
    });
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator />
          Deal Tracker & Commission Calculator
        </CardTitle>
        <CardDescription>
          Track deal progress and calculate commission for any property sale.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="propertyTitle"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Property Title</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="e.g. 5 Marla House in DHA" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                 <FormField
                    control={form.control}
                    name="buyerName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Buyer Name</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="e.g. Ahmed Hassan" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="dealStatus"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Deal Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {dealStatuses.map(status => (
                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="propertyPrice"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Property Price (PKR)</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} placeholder="e.g. 9000000" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <FormField
                    control={form.control}
                    name="commissionPercentage"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Commission (%)</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} placeholder="e.g. 1 or 2" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="agentName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Agent Name</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an agent" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {agentNames.map(name => (
                                    <SelectItem key={name} value={name}>{name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="closingDate"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Closing Date</FormLabel>
                        <FormControl>
                            <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
             </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full md:w-auto">Calculate</Button>
          </CardFooter>
        </form>
      </Form>
      {dealSummary && (
        <div className="p-6 border-t">
            <h3 className="text-lg font-bold mb-4">Deal Summary</h3>
            <Table>
                <TableBody>
                    <TableRow>
                        <TableHead>Commission Amount</TableHead>
                        <TableCell>{dealSummary.commissionAmount}</TableCell>
                    </TableRow>
                     <TableRow>
                        <TableHead>Expected Payment Date</TableHead>
                        <TableCell>{dealSummary.expectedPaymentDate}</TableCell>
                    </TableRow>
                     <TableRow>
                        <TableHead>Summary</TableHead>
                        <TableCell>{dealSummary.summary}</TableCell>
                    </TableRow>
                     <TableRow>
                        <TableHead>Next Action Step</TableHead>
                        <TableCell className="font-bold text-primary">{dealSummary.nextAction}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
      )}
    </Card>
  );
}
