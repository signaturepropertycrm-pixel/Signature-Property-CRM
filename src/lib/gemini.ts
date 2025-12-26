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
      
      **Goal:** Determine if the text is about a "Buyer" (Demand) or a "Property" (Listing).
      
      **Return ONLY a valid JSON object.** No markdown, no explanations.

      **Scenario 1: If it is a BUYER (Demand):**
      Extract the following fields. If a field is not present, use null. For numbers, convert text like '1 crore' to 10000000.
      {
        "type": "Buyer",
        "data": {
          "name": "Extract name if present, else 'Unknown'",
          "phone": "Extract phone number if present",
          "budget_min_amount": Number (e.g. '1 crore' becomes 10000000) or null,
          "budget_min_unit": "Lacs" or "Crore" or "Thousand",
          "budget_max_amount": Number or null,
          "budget_max_unit": "Lacs" or "Crore" or "Thousand",
          "area_preference": "Extract location/society name, can be multiple",
          "property_type_preference": "House, Plot, Flat, Shop, etc.",
          "size_min_value": Number (e.g. 5) or null,
          "size_min_unit": "Marla, Kanal, SqFt" or null,
          "size_max_value": Number or null,
          "size_max_unit": "Marla, Kanal, SqFt" or null,
          "listing_type": "For Sale" or "For Rent"
        }
      }

      **Scenario 2: If it is a PROPERTY (Listing):**
      {
        "type": "Property",
        "data": {
          "auto_title": "Create a short title e.g. '5 Marla House in DHA'",
          "demand_amount": Number (Convert text to actual number) or null,
          "demand_unit": "Lacs" or "Crore",
          "area": "Extract location/society",
          "size_value": Number (e.g. 5) or null,
          "size_unit": "Marla, Kanal, SqFt",
          "property_type": "House, Plot, Flat, Shop, etc.",
          "listing_type": "For Sale" or "For Rent",
          "owner_number": "Extract phone"
        }
      }

      Example Roman Urdu Input: "Assalam o Alaikum Yar mujhe Iqbal Town, Samanabad ma Kahi par bhi ghr chahiye 3 se 5 marla ka 1 Cr demand ha meri"
      Example Output for above: 
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
