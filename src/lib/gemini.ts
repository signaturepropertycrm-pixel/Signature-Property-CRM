// File: src/lib/gemini.ts

import { GoogleGenerativeAI } from "@google/generative-ai";

// API Key environment variable se uthay ga
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function analyzeRealEstateText(text: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Ye wo hidayat (Prompt) ha jo hum AI ko den ge
    const prompt = `
      You are a smart Real Estate AI Assistant for a CRM in Pakistan. 
      Analyze the following text (which can be in English, Urdu, or Roman Urdu).
      
      **Goal:** Determine if the text is about a "Buyer" (Demand) or a "Property" (Listing).
      
      **Return ONLY a valid JSON object.** No markdown, no explanations.

      **Scenario 1: If it is a BUYER (Demand):**
      {
        "type": "Buyer",
        "data": {
          "name": "Extract name if present, else 'Unknown'",
          "phone": "Extract phone number if present",
          "budget_min_amount": Number (Convert e.g. '1 crore' to 10000000) or null,
          "budget_max_amount": Number or null,
          "area_preference": "Extract location/society name",
          "property_type_preference": "House, Plot, Flat, Shop, etc.",
          "size_min_value": Number (e.g. 5) or null,
          "size_min_unit": "Marla/Kanal/SqFt" or null,
          "listing_type": "For Sale" or "For Rent"
        }
      }

      **Scenario 2: If it is a PROPERTY (Listing):**
      {
        "type": "Property",
        "data": {
          "title": "Create a short title e.g. '5 Marla House in DHA'",
          "price": Number (Convert text to actual number) or null,
          "location": "Extract location/society",
          "area": Number (e.g. 5) or null,
          "areaUnit": "Marla/Kanal/SqFt",
          "type": "House, Plot, Flat, Shop, etc.",
          "listing_type": "For Sale" or "For Rent",
          "bedrooms": Number or null,
          "ownerName": "Extract if present",
          "ownerPhone": "Extract phone"
        }
      }

      **Input Text:**
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