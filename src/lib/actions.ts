
'use server';

// This function is not used by the form anymore but is kept for potential future use.
import {
  generateAutoTitle as originalGenerateAutoTitle,
  type AutoTitleInput,
} from '@/ai/flows/auto-title-generation';

// Note: The AI-based shareable text generation is no longer used.
// The logic has been moved directly into the SharePropertyDialog component
// to use a fixed template instead of AI.
// We keep the old files for now but they are not actively used for this feature.
import type { ShareableTextOutput, ShareableTextInput } from '@/ai/flows/shareable-text-generation';


export async function generateAutoTitle(input: AutoTitleInput) {
  // This now uses a simple local function instead of an AI call.
  return { autoTitle: `${input.sizeValue} ${input.sizeUnit} ${input.propertyType} in ${input.area}` };
}
