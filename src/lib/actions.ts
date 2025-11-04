
'use server';

import {
  generateAutoTitle as originalGenerateAutoTitle,
  type AutoTitleInput,
} from '@/ai/flows/auto-title-generation';

import { 
  generateShareableText as originalGenerateShareableText,
  type ShareableTextInput,
  type ShareableTextOutput,
} from '@/ai/flows/shareable-text-generation';


export async function generateAutoTitle(input: AutoTitleInput) {
  return originalGenerateAutoTitle(input);
}

export async function generateShareableText(input: ShareableTextInput): Promise<ShareableTextOutput> {
  return originalGenerateShareableText(input);
}

    
