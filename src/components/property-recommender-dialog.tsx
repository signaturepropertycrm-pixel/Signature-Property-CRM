
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Buyer, Property, RecommendedProperty } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Share2, Sparkles, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { formatCurrency, formatUnit, formatPhoneNumberForWhatsApp } from '@/lib/formatters';
import { useCurrency } from '@/context/currency-context';
import { Progress } from './ui/progress';
import { useToast } from '@/hooks/use-toast';
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from '@/lib/utils';


interface PropertyRecommenderDialogProps {
  buyer: Buyer;
  properties: Property[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

// Function to calculate the match score and reasons
const calculateMatchScore = (buyer: Buyer, property: Property): RecommendedProperty | null => {
    // Basic checks: property must be available
    if (property.status !== 'Available') {
        return null;
    }
    
    // Listing type check: 'For Sale' buyers see sale properties, 'For Rent' see rent.
    const buyerListingType = buyer.listing_type || 'For Sale'; // Default to 'For Sale' if not specified
    const propertyListingType = property.is_for_rent ? 'For Rent' : 'For Sale';
    if (buyerListingType !== propertyListingType) {
        return null;
    }
    
    let score = 0;
    let reasons: string[] = [];

    // 1. Property Type Match (Strict)
    if (buyer.property_type_preference) {
        if (buyer.property_type_preference.toLowerCase() !== property.property_type.toLowerCase()) {
            return null; // Strict: if type doesn't match, don't recommend at all.
        }
        score += 30;
        reasons.push('Property type match.');
    }

    // 2. Area Match (Flexible)
    if (buyer.area_preference) {
        const buyerAreas = buyer.area_preference.toLowerCase().split(',').map(a => a.trim()).filter(Boolean);
        const propertyArea = property.area.toLowerCase();
        if (buyerAreas.length > 0 && buyerAreas.some(area => propertyArea.includes(area))) {
            score += 25;
            reasons.push('Area preference matched.');
        }
    }

    // 3. Budget Match (Flexible)
    const buyerMinBudget = formatUnit(buyer.budget_min_amount || 0, buyer.budget_min_unit || 'Thousand');
    const buyerMaxBudget = formatUnit(buyer.budget_max_amount || 0, buyer.budget_max_unit || 'Lacs');
    const propertyDemand = formatUnit(property.demand_amount, property.demand_unit);
    
    if (buyerMinBudget > 0 && buyerMaxBudget > 0) {
        if (propertyDemand >= buyerMinBudget && propertyDemand <= buyerMaxBudget) {
            score += 25;
            reasons.push('Falls within budget.');
        } else if (propertyDemand >= buyerMinBudget * 0.9 && propertyDemand <= buyerMaxBudget * 1.1) {
            score += 15; // Partial score for being close
            reasons.push('Close to budget.');
        }
    }

    // 4. Size Match (Flexible)
    const buyerMinSize = buyer.size_min_value || 0;
    const buyerMaxSize = buyer.size_max_value || 0;
    const propertySize = property.size_value;

    if (buyerMinSize > 0 && buyerMaxSize > 0 && property.size_unit === (buyer.size_min_unit || buyer.size_max_unit)) {
        if (propertySize >= buyerMinSize && propertySize <= buyerMaxSize) {
            score += 20;
            reasons.push('Size preference matched.');
        } else if (propertySize >= buyerMinSize * 0.9 && propertySize <= buyerMaxSize * 1.1) {
            score += 10; // Partial score for close size
            reasons.push('Close to size preference.');
        }
    }

    // Normalize score
    const maxScore = 30 + 25 + 25 + 20; // Sum of max scores for each criteria
    const finalScore = Math.min(100, Math.round((score / maxScore) * 100));

    if (finalScore < 10) return null; // Lower threshold to show more options

    return { ...property, matchScore: finalScore, matchReasons: reasons };
};

export function PropertyRecommenderDialog({
  buyer,
  properties,
  isOpen,
  setIsOpen,
}: PropertyRecommenderDialogProps) {
    const { currency } = useCurrency();
    const { toast } = useToast();
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = useCallback(() => {
        setRefreshKey(prev => prev + 1);
        toast({ title: "Recommendations Refreshed", description: "The property list has been updated." });
    }, [toast]);


    const recommendedProperties = useMemo(() => {
        if (!buyer || !properties) return [];

        return properties
            .map(prop => calculateMatchScore(buyer, prop))
            .filter((p): p is RecommendedProperty => p !== null)
            .sort((a, b) => b.matchScore - a.matchScore);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [buyer, properties, refreshKey]);

    const handleShare = (property: RecommendedProperty) => {
        const buyerPhone = formatPhoneNumberForWhatsApp(buyer.phone, buyer.country_code);
        let message = '';
    
        if (buyer.listing_type === 'For Rent') {
            // Format for Rent Buyer
            const demand = `${property.demand_amount}${property.demand_unit === 'Thousand' ? 'K' : ` ${property.demand_unit}`}`;
            const utilities = [
                property.meters?.gas && '- Gas',
                property.meters?.electricity && '- Electricity',
                property.meters?.water && '- Water'
            ].filter(Boolean).join('\n');
    
            message = `
*RENT PROPERTY DETAILS 🏡*
*Recommended:* ${property.matchScore}%

Serial No: ${property.serial_no}
Area: ${property.area}
Property Type: ${property.property_type}
Size/Marla: ${property.size_value} ${property.size_unit}
Portion: ${property.storey || 'N/A'}
Demand: ${demand}

*Utilities:*
${utilities || 'N/A'}
            `.trim().replace(/^\s+/gm, '');
    
        } else {
            // Format for Sale Buyer
            const demand = `${property.demand_amount} ${property.demand_unit}`;
            const potentialRent = property.potential_rent_amount ? `Rs.${property.potential_rent_amount.toLocaleString()}` : 'N/A';
            const utilities = [
                property.meters?.gas && '- Gas',
                property.meters?.electricity && '- Electricity',
                property.meters?.water && '- Water'
            ].filter(Boolean).join('\n');
    
            message = `
*PROPERTY DETAILS 🏡*
*Recommended:* ${property.matchScore}%

Serial No: ${property.serial_no}
Area: ${property.area}
Property Type: ${property.property_type}
Size/Marla: ${property.size_value} ${property.size_unit}
Floor: ${property.storey || 'N/A'}
Road Size: ${property.road_size_ft || 'N/A'}
Front/Length: ${property.front_ft ? `${property.front_ft}/${property.length_ft || ''}` : 'N/A'}
Demand: ${demand}

*Financials:*
- Potential Rent: ${potentialRent}

*Utilities:*
${utilities || 'N/A'}

*Documents:* ${property.documents || 'N/A'}
            `.trim().replace(/^\s+/gm, '');
        }
    
        const whatsappUrl = `https://wa.me/${buyerPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        toast({ title: 'Redirecting to WhatsApp', description: `Sharing ${property.serial_no} with ${buyer.name}` });
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'bg-green-600';
        if (score >= 75) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-500';
        if (score >= 40) return 'bg-orange-500';
        return 'bg-red-500';
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <div className="flex justify-between items-center">
                         <DialogTitle className="font-headline flex items-center gap-2 text-2xl">
                            <Sparkles />
                            Property Recommendations for {buyer.name}
                        </DialogTitle>
                        <Button variant="outline" size="sm" onClick={handleRefresh}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                    <DialogDescription>
                        Based on the buyer's preferences, here are the top property matches.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[60vh] pr-4">
                    <div className="space-y-4 py-4">
                        {recommendedProperties.length > 0 ? (
                            recommendedProperties.map(prop => (
                                <div key={prop.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold">{prop.auto_title}</h4>
                                            <p className="text-sm text-muted-foreground">{prop.address}</p>
                                        </div>
                                        <Badge variant="secondary">{formatCurrency(formatUnit(prop.demand_amount, prop.demand_unit), currency)}</Badge>
                                    </div>
                                    <div className="flex items-center gap-4 mt-4">
                                        <div className="w-24 text-center">
                                            <p className="text-xs text-muted-foreground">Match Score</p>
                                            <p className="text-2xl font-bold" style={{ color: `hsl(var(--${getScoreColor(prop.matchScore).replace('bg-','')}-foreground))` }}>{prop.matchScore}%</p>
                                        </div>
                                        <div className="flex-1">
                                            <Progress value={prop.matchScore} className="h-3" indicatorClassName={getScoreColor(prop.matchScore)} />
                                            <div className="text-xs text-muted-foreground mt-1 space-x-2">
                                                {prop.matchReasons.map(reason => (
                                                    <span key={reason}>&#x2022; {reason}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right mt-3">
                                        <Button size="sm" variant="outline" onClick={() => handleShare(prop)}>
                                            <Share2 className="mr-2 h-4 w-4" />
                                            Share via WhatsApp
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">
                                <p>No suitable properties found based on the current criteria.</p>
                                <p className="text-xs">Try adjusting the buyer's preferences for better results.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <Button variant="secondary" onClick={() => setIsOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Custom Progress component to allow dynamic indicator color
const ProgressIndicator = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Indicator> & { indicatorClassName?: string }
>(({ className, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Indicator
    ref={ref}
    className={cn("h-full w-full flex-1 bg-primary transition-all", indicatorClassName, className)}
    {...props}
  />
));
ProgressIndicator.displayName = 'ProgressIndicator';


