
import { z } from 'zod';

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
