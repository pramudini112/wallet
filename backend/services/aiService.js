const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function chatWithAdvisor(message, context = {}) {
  // Build a personalized system prompt with user's financial context
  let systemContext = `You are FinMate AI, a helpful and friendly personal finance advisor for university students in Sri Lanka. 
You give practical, student-friendly advice. Keep responses concise (2-3 paragraphs max). Use LKR (Sri Lankan Rupees) as the currency.`;

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
      model: 'gemini-2.5-flash',
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
    Extract the following information from the expense text: "${text}".
    Return the result as a JSON object with:
    - category (String: one of: canteen, transport, education, health, mobile, social, clothing, utilities, savings, other)
    - amount (Number)
    - description (String: a short description of the expense)
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
    return { category: 'other', amount: 0, description: 'Unknown' };
  }
}

module.exports = { chatWithAdvisor, categorizeExpense };
