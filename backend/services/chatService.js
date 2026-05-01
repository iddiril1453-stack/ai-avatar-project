import { generateAIResponse } from "./aiService.js";
import { classifyIntent } from "./userIntentClassifier.js";
import { salesEngine } from "./salesEngine.js";
import { getUser, addMessage, setIntent } from "./memoryStore.js";

export async function handleChat(userId, userMessage) {
  try {

    const user = getUser(userId);

    // 🧠 USER MESSAGE KAYDET
    addMessage(userId, "user", userMessage);

    const intent = classifyIntent(userMessage);
    setIntent(userId, intent);

    const systemPrompt = `
Senin adın Todi.

Sen araç yenileme merkezi  satış uzmanısın.

Kullanıcı geçmişi:
${user.history.map(m => `${m.role}: ${m.content}`).join("\n")}

Kullanıcının intent durumu:
${intent}

KURALLAR:
- kısa konuş
- direkt ol
- satış odaklı ol
- emoji kullanma
`;

    // 🔥 HOT USER → direkt satış
    if (intent === "hot") {
      const reply = salesEngine(userMessage, intent);

      addMessage(userId, "assistant", reply);

      return { reply, intent };
    }

    // 🟡 WARM → biraz sıkıştır
    if (intent === "warm" && user.history.length > 6) {
      const reply = "Genelde bu noktada Premium tercih ediliyor çünkü koruma farkı ciddi.";

      addMessage(userId, "assistant", reply);

      return { reply, intent };
    }

    // 🤖 AI RESPONSE
    const aiReply = await generateAIResponse(userMessage, systemPrompt);

    addMessage(userId, "assistant", aiReply);

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