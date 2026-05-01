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

    // 🔥 kullanıcı mesajını ekle
    conversationHistory.push({
      role: "user",
      content: userMessage
    });

    // 🔥 son 10 mesajı tut (memory limit)
    const recentHistory = conversationHistory.slice(-10);

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        ...recentHistory
      ]
    });

    const reply = completion.choices[0].message.content;

    // 🔥 AI cevabını da kaydet
    conversationHistory.push({
      role: "assistant",
      content: reply
    });

    return reply;

  } catch (err) {
    console.error("OPENAI ERROR:", err);
    return "AI hata verdi";
  }
}