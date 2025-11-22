import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a phone number to the +92 standard.
 * - Removes leading '0'.
 * - Removes any existing '+92' or '92' to avoid duplication.
 * - Removes all spaces and hyphens.
 * - Ensures the final number starts with '+92'.
 * @param phone The raw phone number string.
 * @returns The formatted phone number string.
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters except for a leading '+'
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Handle cases where number might start with 0092
  if (cleaned.startsWith('0092')) {
    cleaned = cleaned.substring(4);
  }
  // Handle cases where number might start with +92
  else if (cleaned.startsWith('+92')) {
    cleaned = cleaned.substring(3);
  }
  // Handle cases where number might start with 92
  else if (cleaned.startsWith('92')) {
    cleaned = cleaned.substring(2);
  }
  // Handle cases where number might start with 0
  else if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // At this point, 'cleaned' should be the number without any prefix (e.g., 3291400106)
  return `+92${cleaned}`;
}
