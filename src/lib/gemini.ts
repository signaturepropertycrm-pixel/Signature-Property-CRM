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

    const prompt = `
      You are an expert Real Estate AI Assistant for a CRM in Pakistan. Your task is to analyze the user's text, which can be in English, Urdu, or Roman Urdu.

      **Your single most important goal is to determine if the text is about a "Buyer" (Demand) or a "Property" (Listing) and extract key information into a valid JSON object.**

      **CRITICAL INSTRUCTIONS:**
      1.  **YOU MUST RETURN ONLY A VALID JSON OBJECT.** No other text, no markdown, no explanations.
      2.  If a piece of information is not present in the text, its value in the JSON object must be \`null\`.
      3.  Convert all textual numbers to digits (e.g., '1 crore' becomes 10000000, '5 marla' becomes 5).
      4.  The \`type\` field in the root of the JSON MUST be either "Buyer" or "Property".
      5.  If the text mentions a single budget number (e.g., "demand is 1 Cr"), use that value for BOTH \`budget_min_amount\` and \`budget_max_amount\`, and the same for units.
      
      ---
      **JSON STRUCTURES:**

      **If it is a BUYER (Demand):**
      {
        "type": "Buyer",
        "data": {
          "name": "Extract name if present, otherwise 'Unknown'",
          "phone": "Extract phone number if present, otherwise null",
          "budget_min_amount": 10000000, // or null
          "budget_min_unit": "Lacs", // or "Crore", "Thousand", or null
          "budget_max_amount": 10000000, // or null
          "budget_max_unit": "Lacs", // or "Crore", "Thousand", or null
          "area_preference": "Extract location/society name, can be multiple comma-separated, otherwise null",
          "property_type_preference": "House, Plot, Flat, Shop, etc., otherwise null",
          "size_min_value": 5, // or null
          "size_min_unit": "Marla", // or "SqFt", "Kanal", etc., or null
          "size_max_value": 5, // or null
          "size_max_unit": "Marla", // or "SqFt", "Kanal", etc., or null
          "listing_type": "For Sale" // or "For Rent"
        }
      }

      **If it is a PROPERTY (Listing):**
      {
        "type": "Property",
        "data": {
          "auto_title": "Create a short title e.g. '5 Marla House in DHA'",
          "demand_amount": 5000000, // or null
          "demand_unit": "Lacs", // or "Crore", "Thousand", or null
          "area": "Extract location/society, otherwise null",
          "size_value": 5, // or null
          "size_unit": "Marla", // or "SqFt", "Kanal", etc., or null
          "property_type": "House", // or "Plot", "Flat", etc., or null
          "listing_type": "For Sale", // or "For Rent"
          "owner_number": "Extract phone, otherwise null"
        }
      }
      ---
      
      **EXAMPLE ROMAN URDU INPUT:** "Assalam o Alaikum Yar mujhe Iqbal Town, Samanabad ma Kahi par bhi ghr chahiye 3 se 5 marla ka 1 Cr demand ha meri"
      
      **CORRECT OUTPUT FOR EXAMPLE:**
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

      ---
      **Analyze the following text now:**
      "${text}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    const cleanText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // Attempt to parse the cleaned text as JSON.
    try {
        const parsedJson = JSON.parse(cleanText);
        return parsedJson;
    } catch (parseError) {
        console.error("Failed to parse JSON from AI response:", parseError);
        console.error("Raw AI response:", responseText);
        return null;
    }

  } catch (error) {
    console.error("Gemini AI API Error:", error);
    return null;
  }
}
