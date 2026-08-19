const { GoogleGenAI } = require('@google/genai');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
const GEMINI_TIMEOUT_MS = 30000;
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function chatWithAdvisor(message, context = {}) {
  // Build a personalized system prompt with user's financial context
  let systemContext = `You are FinMate AI, a concise personal finance advisor for Sri Lankan university students. Use LKR. Answer only finance, budgeting, saving, investing, or spending questions. Politely decline unrelated questions. Reply in 2-4 short sentences.`;

  if (context.userName) {
    systemContext += `\n\nThe student's name is ${context.userName}.`;
  }
  if (context.monthlyAllowance) {
    systemContext += `\nTheir monthly allowance is ${context.currency} ${context.monthlyAllowance.toLocaleString()}.`;
  }
  if (context.categoryBreakdown && context.categoryBreakdown.length > 0) {
    systemContext += `\nSpending this month:`;
    context.categoryBreakdown.slice(0, 5).forEach(cat => {
      systemContext += `\n- ${cat._id}: ${context.currency} ${cat.total.toLocaleString()} (${cat.count} transactions)`;
    });
  }
  if (context.recentTransactions && context.recentTransactions.length > 0) {
    systemContext += `\n\nRecent transactions:`;
    context.recentTransactions.slice(0, 3).forEach(t => {
      systemContext += `\n- ${t.type}: ${context.currency} ${t.amount} for ${t.category}${t.description ? ` (${t.description})` : ''}`;
    });
  }

  const prompt = `${systemContext}\n\nStudent's question: ${message}`;
  
  try {
    const response = await Promise.race([
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: { maxOutputTokens: 256, temperature: 0.2 },
      }),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Gemini request timed out.')), GEMINI_TIMEOUT_MS);
      }),
    ]);
    return response.text;
  } catch (error) {
    console.error('Error with Gemini API:', error);
    throw new Error('Gemini API request failed. Check GEMINI_API_KEY and GEMINI_MODEL.');
  }
}

async function categorizeExpense(text) {
  const prompt = `
    You are a Sri Lankan university student expense categorizer.
    Extract the following information from the expense text: "${text}".
    
    Category rules (STRICT - must follow exactly):
    - canteen: any food/meal/drink at campus canteen, rice & curry, short eats, tea, kottu, etc.
    - transport: ANY travel expense including tuk, tuk-tuk, three-wheeler, trishaw, bus, train, uber, pickme, taxi, fare, ride, van
    - education: books, photocopy, stationery, printing, lab fees, tuition, course fees
    - health: medicine, pharmacy, doctor, hospital, clinic, medical
    - mobile: mobile data, SIM, phone bill, recharge, dialog, mobitel, airtel
    - social: outings, parties, movies, events, hangouts with friends
    - clothing: clothes, shoes, accessories, uniform
    - utilities: electricity, water, internet, wifi, boarding fees
    - savings: savings, deposit, investment
    - other: anything that doesn't fit the above categories
    
    Return ONLY a JSON object with:
    - category (String: must be one of the exact category names above)
    - amount (Number: extract from text, or 0 if not mentioned)
    - description (String: a short, clean description of the expense)
    No markdown, no explanation, just the JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
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
    return { category: 'other', amount: 0, description: 'Unknown' };
  }
}

module.exports = { chatWithAdvisor, categorizeExpense };
