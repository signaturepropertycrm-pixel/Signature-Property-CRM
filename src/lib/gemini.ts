// File: src/lib/gemini.ts

import { GoogleGenerativeAI } from "@google/generative-ai";

// API Key environment variable se uthay ga
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
if (!apiKey) {
  console.error("Gemini API Key not found. Please set NEXT_PUBLIC_GEMINI_API_KEY environment variable.");
}
const genAI = new GoogleGenerativeAI(apiKey);

export async function analyzeRealEstateText(text: string) {
  if (!apiKey) {
    console.error("AI analysis failed: Gemini API Key is missing.");
    return null;
  }
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Ye wo hidayat (Prompt) ha jo hum AI ko den ge
    const prompt = `
      You are a smart Real Estate AI Assistant for a CRM in Pakistan. 
      Analyze the following text (which can be in English, Urdu, or Roman Urdu).
      
      **Your Goal:** Your single most important goal is to determine if the text is about a "Buyer" (Demand) or a "Property" (Listing) and extract key information.

      **CRITICAL INSTRUCTION:** You MUST return ONLY a valid JSON object. No markdown, no introductory text, no explanations. Just the raw JSON.

      **Rules for Extraction:**
      1.  If a field is not present in the text, its value in the JSON should be \`null\`.
      2.  Convert textual numbers to digits (e.g., '1 crore' becomes 10000000, '5 marla' becomes 5).
      3.  **Budget Rule:** If only one budget amount is mentioned (e.g., "demand is 1 Cr"), set both \`budget_min_amount\` and \`budget_max_amount\` to that same value.
      4.  The \`type\` field MUST be either "Buyer" or "Property".

      ---
      **Scenario 1: If it is a BUYER (Demand):**
      Use this JSON structure.
      {
        "type": "Buyer",
        "data": {
          "name": "Extract name if present, else 'Unknown'",
          "phone": "Extract phone number if present, else null",
          "budget_min_amount": 10000000,
          "budget_min_unit": "Crore",
          "budget_max_amount": 10000000,
          "budget_max_unit": "Crore",
          "area_preference": "Extract location/society name, can be multiple comma-separated",
          "property_type_preference": "House, Plot, Flat, Shop, etc.",
          "size_min_value": 5,
          "size_min_unit": "Marla",
          "size_max_value": 5,
          "size_max_unit": "Marla",
          "listing_type": "For Sale"
        }
      }

      **Scenario 2: If it is a PROPERTY (Listing):**
      Use this JSON structure.
      {
        "type": "Property",
        "data": {
          "auto_title": "Create a short title e.g. '5 Marla House in DHA'",
          "demand_amount": 5000000,
          "demand_unit": "Lacs",
          "area": "Extract location/society",
          "size_value": 5,
          "size_unit": "Marla",
          "property_type": "House",
          "listing_type": "For Sale",
          "owner_number": "Extract phone, else null"
        }
      }
      ---

      **Example Roman Urdu Input:** "Assalam o Alaikum Yar mujhe Iqbal Town, Samanabad ma Kahi par bhi ghr chahiye 3 se 5 marla ka 1 Cr demand ha meri"
      **Correct Output for Example:** 
      {
        "type": "Buyer",
        "data": {
          "name": "Unknown",
          "phone": null,
          "budget_min_amount": 1,
          "budget_min_unit": "Crore",
          "budget_max_amount": 1,
          "budget_max_unit": "Crore",
          "area_preference": "Iqbal Town, Samanabad",
          "property_type_preference": "House",
          "size_min_value": 3,
          "size_min_unit": "Marla",
          "size_max_value": 5,
          "size_max_unit": "Marla",
          "listing_type": "For Sale"
        }
      }

      **Input Text to Analyze:**
      "${text}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Safai suthrai (Cleaning json markdown)
    const cleanText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(cleanText);

  } catch (error) {
    console.error("Gemini AI Error:", error);
    return null;
  }
}
