const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function chatWithAdvisor(message, context = {}) {
  // Build a personalized system prompt with user's financial context
  let systemContext = `You are FinMate AI, a helpful and friendly personal finance advisor for university students in Sri Lanka. 
You give practical, student-friendly advice. Keep responses concise (2-3 paragraphs max). Use LKR (Sri Lankan Rupees) as the currency.

CRITICAL INSTRUCTION: You must ONLY answer questions related to personal finance, budgeting, saving, investing, or the user's spending habits.
If the user asks a question that is NOT related to finance, you MUST politely decline to answer and explain that you can only help with finance-related topics.`;

  if (context.userName) {
    systemContext += `\n\nThe student's name is ${context.userName}.`;
  }
  if (context.monthlyAllowance) {
    systemContext += `\nTheir monthly allowance is ${context.currency} ${context.monthlyAllowance.toLocaleString()}.`;
  }
  if (context.categoryBreakdown && context.categoryBreakdown.length > 0) {
    systemContext += `\n\nThis month's spending by category:`;
    context.categoryBreakdown.forEach(cat => {
      systemContext += `\n- ${cat._id}: ${context.currency} ${cat.total.toLocaleString()} (${cat.count} transactions)`;
    });
  }
  if (context.recentTransactions && context.recentTransactions.length > 0) {
    systemContext += `\n\nRecent transactions:`;
    context.recentTransactions.slice(0, 5).forEach(t => {
      systemContext += `\n- ${t.type}: ${context.currency} ${t.amount} for ${t.category}${t.description ? ` (${t.description})` : ''}`;
    });
  }

  const prompt = `${systemContext}\n\nStudent's question: ${message}`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error('Error with Gemini API:', error);
    return "I'm having trouble connecting to my brain right now. Please try again in a moment.";
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
      model: 'gemini-3.6-flash',
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
