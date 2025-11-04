
'use server';
/**
 * @fileOverview Generates shareable text for a property for customers and agents.
 */
import { ai } from '@/ai/genkit';
import {
  ShareableTextInputSchema,
  ShareableTextOutputSchema,
  type ShareableTextInput,
  type ShareableTextOutput,
} from './shareable-text-schemas';


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
{{#if road_size_ft}}Road Size: {{{road_size_ft}}} ft{{/if}}
{{#if front_ft}}Front/Length: {{{front_ft}}} ft{{/if}}
Demand: {{{demand_amount}}} {{{demand_unit}}}

**Financials:**
{{#if potential_rent_amount}}- Potential Rent: {{{potential_rent_amount}}}K{{else}}- Potential Rent: N/A{{/if}}

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
{{#if road_size_ft}}Road Size: {{{road_size_ft}}} ft{{/if}}
{{#if front_ft}}Front/Length: {{{front_ft}}} ft{{/if}}
Demand: {{{demand_amount}}} {{{demand_unit}}}
Owner Number: {{{owner_number}}}

**Financials:**
{{#if potential_rent_amount}}- Potential Rent: {{{potential_rent_amount}}}K{{else}}- Potential Rent: N/A{{/if}}

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
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error('AI failed to generate shareable text.');
      }
      return output;
    } catch (error: any) {
        console.error("Error in shareableTextFlow:", error);
        // Re-throw a more user-friendly error
        throw new Error(error.message || 'An unexpected error occurred while generating text.');
    }
  }
);
