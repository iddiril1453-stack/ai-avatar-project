import OpenAI from "openai";

console.log("AI SERVICE LOADED");

let openai;

function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
}

let conversationHistory = [];

export async function generateAIResponse(userMessage, systemPrompt = "") {
  try {

    const client = getOpenAI();

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    return completion.choices[0].message.content;

  } catch (err) {
    console.error("OPENAI ERROR:", err);
    return "AI hata verdi";
  }
}