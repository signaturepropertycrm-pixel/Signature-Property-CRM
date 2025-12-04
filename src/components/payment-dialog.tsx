
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
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Copy, Check, Info } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export type Plan = {
    name: string;
    price: { monthly: number; yearly: number; } | { custom: true; };
    description: string;
    features: string[];
    cta: string;
    isPopular: boolean;
};

interface PaymentDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  plan: Plan;
  billingCycle: 'monthly' | 'yearly';
}

export function PaymentDialog({ isOpen, setIsOpen, plan, billingCycle }: PaymentDialogProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (plan.price.custom) {
      // Handle custom plan - maybe show contact info
      return null;
  }
  
  const price = billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly;

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Complete Your Payment</DialogTitle>
          <DialogDescription>
            You have selected the <strong>{plan.name} ({billingCycle})</strong> plan.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
             <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Instructions</AlertTitle>
                <AlertDescription>
                    Please transfer the amount to the account below and contact support with your transaction receipt to activate your plan.
                </AlertDescription>
            </Alert>

            <Separator className="my-4" />

            <Card>
                <CardContent className="p-6 space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Amount to Pay:</span>
                        <span className="font-bold text-lg">RS {price.toLocaleString()}</span>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-primary">JazzCash Account Details</p>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Account Name:</span>
                            <span className="font-mono">Usman Sagheer</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Account Number:</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono">0300-1234567</span>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy('03001234567')}>
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
        
        <DialogFooter>
          <Button variant="secondary" onClick={() => setIsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

