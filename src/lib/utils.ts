
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a phone number based on the selected country code.
 * - Removes leading '0' if the country code is '+92'.
 * - Removes any existing country code from the number to avoid duplication.
 * - Removes all non-digit characters.
 * - Prepends the selected country code.
 * @param phone The raw phone number string.
 * @param countryCode The selected country code (e.g., '+92').
 * @returns The formatted phone number string.
 */
export function formatPhoneNumber(phone: string, countryCode: string = '+92'): string {
  if (!phone) return '';
  
  // Remove all non-digit characters from the phone number
  let cleaned = phone.replace(/\D/g, '');
  const codeWithoutPlus = countryCode.replace('+', '');

  // If the selected country code is for Pakistan, remove leading zero if present
  if (countryCode === '+92' && cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Remove any country code prefix from the cleaned number to avoid duplication
  if (cleaned.startsWith(codeWithoutPlus)) {
      cleaned = cleaned.substring(codeWithoutPlus.length);
  }

  // Combine the country code and the cleaned number
  return `${countryCode}${cleaned}`;
}


    