import OpenAI from "openai";
import type { JournalEntry } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface AIInsight {
  category: "mood" | "productivity" | "growth" | "patterns";
  title: string;
  insight: string;
  recommendation: string;
  confidence: number;
}

export async function analyzeJournalEntries(entries: JournalEntry[]): Promise<AIInsight[]> {
  if (entries.length < 3) {
    throw new Error("Need at least 3 journal entries for meaningful analysis");
  }

  // Prepare journal data for analysis
  const journalData = entries.map(entry => ({
    date: entry.createdAt,
    title: entry.title || "Untitled",
    content: entry.content,
    mood: entry.mood || "neutral",
    tags: entry.tags || [],
  }));

  const prompt = `
You are FlowAI, an expert productivity and wellness coach analyzing journal entries to provide personalized insights. 

Analyze the following journal entries and provide 3-5 actionable insights in JSON format:

${JSON.stringify(journalData, null, 2)}

Please provide insights in these categories:
- mood: Emotional patterns and mental wellness
- productivity: Work habits and efficiency patterns  
- growth: Personal development opportunities
- patterns: Behavioral trends and recurring themes

For each insight, provide:
- category: One of the four categories above
- title: A clear, engaging title (max 50 characters)
- insight: A detailed observation about their patterns (max 150 characters)
- recommendation: Specific, actionable advice (max 150 characters)
- confidence: A decimal between 0.7 and 1.0 representing confidence in the insight

Focus on:
1. Mood trends and emotional patterns
2. Productivity and focus patterns
3. Growth areas and positive changes
4. Recurring themes or concerning patterns
5. Actionable recommendations for improvement

Respond with JSON in this exact format:
{
  "insights": [
    {
      "category": "mood",
      "title": "Example Title",
      "insight": "Your observation here",
      "recommendation": "Specific action they can take",
      "confidence": 0.85
    }
  ]
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are FlowAI, a productivity and wellness coach. Provide insights as valid JSON only, no additional text."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.insights || [];
  } catch (error) {
    console.error("Error analyzing journal entries:", error);
    throw new Error("Failed to analyze journal entries: " + (error as Error).message);
  }
}

export async function generateDailyReflection(entries: JournalEntry[]): Promise<string> {
  const recentEntries = entries.slice(-7); // Last 7 entries
  
  if (recentEntries.length === 0) {
    return "Start writing journal entries to receive personalized daily reflections from FlowAI.";
  }

  const prompt = `
Based on these recent journal entries, provide a brief, encouraging daily reflection (max 200 words):

${JSON.stringify(recentEntries.map(e => ({
  date: e.createdAt,
  content: e.content,
  mood: e.mood,
  tags: e.tags
})), null, 2)}

Provide a supportive, insightful reflection that:
1. Acknowledges their recent experiences
2. Highlights positive patterns or growth
3. Offers gentle encouragement for challenges
4. Suggests a small, actionable step for today

Write in a warm, supportive tone as their personal wellness coach.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are FlowAI, a supportive wellness coach providing daily reflections."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    return response.choices[0].message.content || "Take a moment today to reflect on your journey and appreciate your progress.";
  } catch (error) {
    console.error("Error generating daily reflection:", error);
    throw new Error("Failed to generate daily reflection");
  }
}