const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function chatWithAdvisor(message) {
  // In a real implementation, you would pass the user's financial context here.
  const prompt = `You are a helpful personal finance AI advisor. Answer the following question: ${message}`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error('Error with Gemini API:', error);
    return "I'm having trouble connecting to my brain right now.";
  }
}

async function categorizeExpense(text) {
  const prompt = `
    Extract the following information from the expense text: "${text}".
    Return the result as a JSON object with:
    - category (String: Food, Transport, Shopping, Education, Entertainment, Health, Bills, Rent, Investment, Other)
    - amount (Number)
    - merchant (String)
    Just the JSON, no markdown formatting.
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    // Attempt to parse JSON response
    let jsonStr = response.text.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error categorizing expense:', error);
    return { category: 'Other', amount: 0, merchant: 'Unknown' };
  }
}

module.exports = { chatWithAdvisor, categorizeExpense };
