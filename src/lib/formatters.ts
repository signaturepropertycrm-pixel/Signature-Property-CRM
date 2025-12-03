
'use client';

import type { Currency } from "@/context/currency-context";
import type { PriceUnit } from "./types";

const currencySymbols: Record<Currency, string> = {
    PKR: 'RS',
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
    
    // For compact notation on dashboard
    if (options.notation === 'compact' && currency === 'PKR') {
         if (value >= 10000000) {
             return `${symbol} ${Number((value / 10000000).toFixed(2))}Cr`;
         }
         if (value >= 100000) {
              return `${symbol} ${Number((value / 100000).toFixed(2))}Lac`;
         }
         if (value >= 1000) {
              return `${symbol} ${Number((value / 1000).toFixed(1))}k`;
         }
         return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD', // using USD as a base for formatting, but with custom symbol
            notation: 'compact',
            compactDisplay: 'short',
            maximumFractionDigits: 1,
         }).format(value).replace('$', `${symbol} `);
    }
    
    // Custom Lacs/Crore formatting for PKR elsewhere
    if (currency === 'PKR') {
        if (value >= 10000000) {
            return `${symbol} ${Number((value / 10000000).toFixed(2))} Crore`;
        }
        if (value >= 100000) {
            return `${symbol} ${Number((value / 100000).toFixed(2))} Lacs`;
        }
    }

    const formattedValue = new Intl.NumberFormat('en-US', options).format(value);

    return `${symbol} ${formattedValue}`;
};

export const formatPhoneNumberForWhatsApp = (phone: string, countryCode: string = '+92'): string => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');

  // Remove leading '0' if present for Pakistan numbers
  if (countryCode === '+92' && cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Return number with country code but without '+'
  return `${countryCode.replace('+', '')}${cleaned}`;
};
