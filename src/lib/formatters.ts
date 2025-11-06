
'use client';

import type { Currency } from "@/context/currency-context";
import type { PriceUnit } from "./types";

const currencySymbols: Record<Currency, string> = {
    PKR: 'PKR',
    USD: '$',
    AED: 'AED',
};

// Converts Lacs/Crore into a base number for consistent calculations
export const formatUnit = (amount: number, unit: PriceUnit): number => {
    switch (unit) {
        case 'Thousand':
            return amount * 1000;
        case 'Lacs':
            return amount * 100000;
        case 'Crore':
            return amount * 10000000;
        default:
            return amount;
    }
};

export const formatCurrency = (
    value: number,
    currency: Currency,
    options: Intl.NumberFormatOptions = {}
): string => {
    const symbol = currencySymbols[currency];
    
    // For compact notation, we don't use a currency symbol, just the notation (e.g., K, M, B)
    if (options.notation === 'compact') {
         if (currency === 'PKR' && value >= 10000000) {
             return `${(value / 10000000).toFixed(2)}Cr`;
         }
         if (currency === 'PKR' && value >= 100000) {
              return `${(value / 100000).toFixed(2)} Lacs`;
         }
         return new Intl.NumberFormat('en-US', {
            ...options,
            maximumFractionDigits: 1,
         }).format(value);
    }

    const formattedValue = new Intl.NumberFormat('en-US', options).format(value);

    return `${symbol} ${formattedValue}`;
};
