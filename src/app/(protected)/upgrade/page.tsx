

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Check, ArrowRight, Star, Info } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useProfile } from '@/context/profile-context';
import { format } from 'date-fns';

const plans = [
    {
        name: 'Basic',
        price: { monthly: 5000, yearly: 50000 },
        description: 'Ideal for small agencies getting started and managing a focused portfolio.',
        features: [
            'Up to 500 Properties',
            'Up to 500 Buyers',
            'Up to 3 Team Members',
            'Core CRM Features',
            'Reports & Analytics',
            'Follow-ups & Appointments',
            'Standard Support',
        ],
        cta: 'Choose Basic',
        isPopular: false,
    },
    {
        name: 'Standard',
        price: { monthly: 15000, yearly: 150000 },
        description: 'For growing agencies that need more power and collaboration.',
        features: [
            'Up to 2,500 Properties',
            'Up to 2,500 Buyers',
            'Up to 10 Team Members',
            'All Basic Features',
            'Access to All Tools',
            'View All Activities',
            'Priority Support',
        ],
        cta: 'Choose Standard',
        isPopular: true,
    },
    {
        name: 'Premium',
        price: { custom: true },
        description: 'For large teams requiring advanced features and unlimited scale.',
        features: [
            'Unlimited Properties',
            'Unlimited Buyers',
            'Unlimited Team Members',
            'All Standard Features',
            'Custom Integrations',
            'Dedicated Account Manager',
            '24/7 Premium Support',
        ],
        cta: 'Contact Sales',
        isPopular: false,
    }
];


export default function UpgradePage() {
    const [isYearly, setIsYearly] = useState(false);
    const { profile } = useProfile();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight font-headline">Find the Right Plan for Your Agency</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          From solo agents to large-scale enterprises, we have a plan that fits your needs. Scale as you grow.
        </p>
      </div>
      
       <Alert className="max-w-2xl mx-auto bg-primary/10 border-primary/30">
          <Info className="h-4 w-4" />
          <AlertTitle className="font-bold">30-Day Free Trial</AlertTitle>
          <AlertDescription>
            {profile.trialEndDate && profile.daysLeftInTrial !== undefined && profile.daysLeftInTrial > 0 ? (
                <span>
                    Your free trial of the Standard plan ends in <strong>{profile.daysLeftInTrial} days</strong> (on {format(new Date(profile.trialEndDate), 'PPP')}).
                </span>
            ) : (
                'All new agency accounts automatically start on a 30-day free trial of our Standard plan.'
            )}
          </AlertDescription>
        </Alert>

       <div className="flex items-center justify-center space-x-4">
        <span className={cn("font-medium", !isYearly && "text-primary")}>Monthly</span>
        <Switch
          checked={isYearly}
          onCheckedChange={setIsYearly}
          aria-label="Toggle between monthly and yearly pricing"
        />
        <span className={cn("font-medium", isYearly && "text-primary")}>Yearly</span>
        <span className="text-sm font-semibold text-green-600">(Save 2 months!)</span>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 items-start max-w-7xl mx-auto">
        {plans.map((plan) => (
          <Card key={plan.name} className={cn("flex flex-col h-full", plan.isPopular && "border-primary border-2 shadow-primary/20")}>
            {plan.isPopular && (
                 <div className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider text-center py-1 rounded-t-lg -mt-px flex items-center justify-center gap-2">
                    <Star className="h-4 w-4" />
                    Most Popular
                </div>
            )}
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold font-headline">{plan.name}</CardTitle>
                <div className="text-4xl font-extrabold my-4">
                    {plan.price.custom ? (
                        'Custom'
                    ) : (
                        `RS ${isYearly ? plan.price.yearly.toLocaleString() : plan.price.monthly.toLocaleString()}`
                    )}
                    {!plan.price.custom && (
                         <span className="text-sm font-normal text-muted-foreground">/{isYearly ? 'year' : 'month'}</span>
                    )}
                </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className="mr-3 h-5 w-5 flex-shrink-0 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className={cn("w-full", plan.isPopular && 'glowing-btn')} variant={plan.isPopular ? 'default' : 'outline'}>
                {plan.cta} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
