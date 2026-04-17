import { generateAIResponse } from "./aiService.js";
import { classifyIntent } from "./userIntentClassifier.js";
import { salesEngine } from "./salesEngine.js";

console.log("CHAT SERVICE LOADED");

const COMPANY_INFO = `
Todikar araç kaplama merkezidir.

PPF = en güçlü koruma
Deluxe = parça kaplama
Premium = full araç kaplama
`;

export async function handleChat(userMessage) {
  try {

    const intent = classifyIntent(userMessage);

   const systemPrompt = `
Senin adın Todi.

Sen bir araç kaplama (PPF) satış asistanısın.

KURALLAR:
- Emoji kullanma (ASLA)
- El sallama, aksiyon anlatma yapma
- “benim adım yok” deme
- Kısa ve direkt konuş
- Robot gibi değil, doğal insan gibi konuş
- Gereksiz açıklama yapma

GÖREV:
- Kullanıcıya PPF ve araç koruma hakkında yardımcı ol
- Satışa uygun fırsatları fark et

Şirket:
${COMPANY_INFO}
`;

    // 👋 GREET
    if (intent === "greet") {
      return {
        reply: "Merhaba 👋 ben Todi. Aracın için en iyi koruma çözümlerini sunabilirim.",
        intent
      };
    }

    // 🔥 HOT = SALES
    if (intent === "hot") {
      return {
        reply: salesEngine(userMessage, intent),
        intent
      };
    }

    // 🤖 AI
    const aiReply = await generateAIResponse(userMessage, systemPrompt);

    return {
      reply: aiReply,
      intent
    };

  } catch (err) {
    console.error("CHAT ERROR:", err);

    return {
      reply: "Bir hata oluştu",
      intent: "cold"
    };
  }
}