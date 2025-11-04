'use server';

/**
 * @fileOverview Generates a property title based on property details.
 *
 * - generateAutoTitle - A function that generates a property title.
 * - AutoTitleInput - The input type for the generateAutoTitle function.
 * - AutoTitleOutput - The return type for the generateAutoTitle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoTitleInputSchema = z.object({
  sizeValue: z.number().describe('The size value of the property.'),
  sizeUnit: z.enum(['Marla', 'SqFt', 'Kanal', 'Acre', 'Maraba']).describe('The unit of size for the property.'),
  propertyType: z.string().describe('The type of property (e.g., House, Plot).'),
  area: z.string().describe('The area or location of the property.'),
});
export type AutoTitleInput = z.infer<typeof AutoTitleInputSchema>;

const AutoTitleOutputSchema = z.object({
  autoTitle: z.string().describe('The automatically generated property title.'),
});
export type AutoTitleOutput = z.infer<typeof AutoTitleOutputSchema>;

export async function generateAutoTitle(input: AutoTitleInput): Promise<AutoTitleOutput> {
  return autoTitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'autoTitlePrompt',
  input: {schema: AutoTitleInputSchema},
  output: {schema: AutoTitleOutputSchema},
  prompt: `Generate a concise and descriptive property title based on the following details:\n\nSize: {{{sizeValue}}} {{{sizeUnit}}}\nProperty Type: {{{propertyType}}}\nArea: {{{area}}}\n\nThe title should follow the format: "{size} {unit} {propertyType} in {area}".  For example, "5 Marla House in Harbanspura".`,
});

const autoTitleFlow = ai.defineFlow(
  {
    name: 'autoTitleFlow',
    inputSchema: AutoTitleInputSchema,
    outputSchema: AutoTitleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
