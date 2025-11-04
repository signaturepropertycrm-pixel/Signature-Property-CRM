'use server';
/**
 * @fileOverview Generates shareable text for a property for customers and agents.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Property } from '@/lib/types';


// We can't pass the full Property type directly as Genkit flows don't support complex types well.
// So we define a Zod schema that matches the properties we need.
export const ShareableTextInputSchema = z.object({
  serial_no: z.string(),
  area: z.string(),
  address: z.string(),
  property_type: z.string(),
  size_value: z.number(),
  size_unit: z.string(),
  storey: z.string().optional(),
  road_size_ft: z.number().optional(),
  front_ft: z.number().optional(),
  length_ft: z.number().optional(),
  demand_amount: z.number(),
  demand_unit: z.string(),
  owner_number: z.string(),
  potential_rent_amount: z.number().optional(),
  potential_rent_unit: z.string().optional(),
  meters: z.object({
    electricity: z.boolean(),
    gas: z.boolean(),
    water: z.boolean(),
  }).optional(),
  documents: z.string().optional(),
});

export type ShareableTextInput = z.infer<typeof ShareableTextInputSchema>;

export const ShareableTextOutputSchema = z.object({
  forCustomer: z.string().describe("Formatted text for the customer."),
  forAgent: z.string().describe("Formatted text for the agent."),
});
export type ShareableTextOutput = z.infer<typeof ShareableTextOutputSchema>;


export async function generateShareableText(input: ShareableTextInput): Promise<ShareableTextOutput> {
  // Map the full property object to the schema for the AI flow
  const flowInput: ShareableTextInput = {
      serial_no: input.serial_no,
      area: input.area,
      address: input.address,
      property_type: input.property_type,
      size_value: input.size_value,
      size_unit: input.size_unit,
      storey: input.storey,
      road_size_ft: input.road_size_ft,
      front_ft: input.front_ft,
      length_ft: input.length_ft,
      demand_amount: input.demand_amount,
      demand_unit: input.demand_unit,
      owner_number: input.owner_number,
      potential_rent_amount: input.potential_rent_amount,
      potential_rent_unit: input.potential_rent_unit,
      meters: input.meters,
      documents: input.documents
  };
  return shareableTextFlow(flowInput);
}

const customerPrompt = `
**PROPERTY DETAILS 🏡**
Serial No: {{{serial_no}}}
Area: {{{area}}}
Property Type: {{{property_type}}}
Size/Marla: {{{size_value}}} {{{size_unit}}}
{{#if storey}}Floor: {{{storey}}}{{/if}}
{{#if road_size_ft}}Road Size: {{{road_size_ft}}}{{/if}}
{{#if front_ft}}Front/Length: {{{front_ft}}}{{/if}}
Demand: {{{demand_amount}}} {{{demand_unit}}}

**Financials:**
{{#if potential_rent_amount}}- Potential Rent: {{{potential_rent_amount}}}{{#if potential_rent_unit}}{{{potential_rent_unit}}}{{/if}}{{else}}- Potential Rent: N/A{{/if}}

**Utilities:**
{{#if meters.gas}}- *Gas*{{/if}}
{{#if meters.electricity}}- *Electricity*{{/if}}
{{#if meters.water}}- *Water*{{/if}}
{{#unless meters.gas}}{{#unless meters.electricity}}{{#unless meters.water}}No utilities listed.{{/unless}}{{/unless}}{{/unless}}

**Documents:** {{{documents}}}`;

const agentPrompt = `
**PROPERTY DETAILS 🏡**
Serial No: {{{serial_no}}}
Area: {{{area}}}
Full Address: {{{address}}}
Property Type: {{{property_type}}}
Size/Marla: {{{size_value}}} {{{size_unit}}}
{{#if storey}}Floor: {{{storey}}}{{/if}}
{{#if road_size_ft}}Road Size: {{{road_size_ft}}}{{/if}}
{{#if front_ft}}Front/Length: {{{front_ft}}}{{/if}}
Demand: {{{demand_amount}}} {{{demand_unit}}}
Owner Number: {{{owner_number}}}

**Financials:**
{{#if potential_rent_amount}}- Potential Rent: {{{potential_rent_amount}}}{{#if potential_rent_unit}}{{{potential_rent_unit}}}{{/if}}{{else}}- Potential Rent: N/A{{/if}}

**Utilities:**
{{#if meters.gas}}- *Gas*{{/if}}
{{#if meters.electricity}}- *Electricity*{{/if}}
{{#if meters.water}}- *Water*{{/if}}
{{#unless meters.gas}}{{#unless meters.electricity}}{{#unless meters.water}}No utilities listed.{{/unless}}{{/unless}}{{/unless}}

**Documents:** {{{documents}}}`;

const prompt = ai.definePrompt({
  name: 'shareableTextPrompt',
  input: { schema: ShareableTextInputSchema },
  output: { schema: ShareableTextOutputSchema },
  prompt: `
    Generate two versions of a property description based on the provided data.
    One for the "customer" and one for the "agent".
    
    Use the following template for the customer version:
    ${customerPrompt}

    Use the following template for the agent version:
    ${agentPrompt}

    Return the final text in the specified JSON format.
  `,
});

const shareableTextFlow = ai.defineFlow(
  {
    name: 'shareableTextFlow',
    inputSchema: ShareableTextInputSchema,
    outputSchema: ShareableTextOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
