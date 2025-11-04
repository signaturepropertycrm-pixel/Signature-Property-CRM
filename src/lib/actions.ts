'use server';

import {
  generateAutoTitle as originalGenerateAutoTitle,
  type AutoTitleInput,
} from '@/ai/flows/auto-title-generation';

export async function generateAutoTitle(input: AutoTitleInput) {
  return originalGenerateAutoTitle(input);
}
