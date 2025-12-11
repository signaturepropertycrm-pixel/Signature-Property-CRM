
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
  const customerText = `
**PROPERTY DETAILS 🏡**
Serial No: ${input.serial_no}
Area: ${input.area}
Property Type: ${input.property_type}
Size/Marla: ${input.size_value} ${input.size_unit}
${input.storey ? `Floor: ${input.storey}` : ''}
${input.road_size_ft ? `Road Size: ${input.road_size_ft} ft` : ''}
${input.front_ft ? `Front/Length: ${input.front_ft} ft` : ''}
Demand: ${input.demand_amount} ${input.demand_unit}

**Financials:**
${input.potential_rent_amount ? `- Potential Rent: ${input.potential_rent_amount}K` : '- Potential Rent: N/A'}

**Utilities:**
${input.meters?.gas ? '- *Gas*' : ''}
${input.meters?.electricity ? '- *Electricity*' : ''}
${input.meters?.water ? '- *Water*' : ''}
${!input.meters?.gas && !input.meters?.electricity && !input.meters?.water ? 'No utilities listed.' : ''}

**Documents:** ${input.documents}`;

  const agentText = `
**PROPERTY DETAILS 🏡**
Serial No: ${input.serial_no}
Area: ${input.area}
Full Address: ${input.address}
Property Type: ${input.property_type}
Size/Marla: ${input.size_value} ${input.size_unit}
${input.storey ? `Floor: ${input.storey}` : ''}
${input.road_size_ft ? `Road Size: ${input.road_size_ft} ft` : ''}
${input.front_ft ? `Front/Length: ${input.front_ft} ft` : ''}
Demand: ${input.demand_amount} ${input.demand_unit}
Owner Number: ${input.owner_number}

**Financials:**
${input.potential_rent_amount ? `- Potential Rent: ${input.potential_rent_amount}K` : '- Potential Rent: N/A'}

**Utilities:**
${input.meters?.gas ? '- *Gas*' : ''}
${input.meters?.electricity ? '- *Electricity*' : ''}
${input.meters?.water ? '- *Water*' : ''}
${!input.meters?.gas && !input.meters?.electricity && !input.meters?.water ? 'No utilities listed.' : ''}

**Documents:** ${input.documents}`;

  return {
    forCustomer: customerText.trim(),
    forAgent: agentText.trim(),
  };
}

    