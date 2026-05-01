import { generateAIResponse } from "./aiService.js";
import { classifyIntent } from "./userIntentClassifier.js";
import { salesEngine } from "./salesEngine.js";
import { getUser, addMessage, setIntent } from "./memoryStore.js";

export async function handleChat(userId, userMessage) {
  try {

    const user = getUser(userId);

function mapIntentToState(intent) {
  if (intent === "hot") return "talking";
  if (intent === "warm") return "thinking";
  return "idle";
}


    // 🧠 USER MESSAGE KAYDET
    addMessage(userId, "user", userMessage);

    const intent = classifyIntent(userMessage);
    setIntent(userId, intent);

const systemPrompt = `
Sen Todi adında bir araç kaplama satış uzmanısın.

Kullanıcı geçmişi:
${user.history.map(m => `${m.role}: ${m.content}`).join("\n")}

Kullanıcının seviyesi:
${user.stage}

KURAL:
- kısa konuş
- satış odaklı ol
- kullanıcıyı yönlendir
- teklifleri doğal ver
`;

    // 🔥 HOT USER → direkt satış
    if (intent === "hot") {
      const reply = salesEngine(userMessage, intent);

      addMessage(userId, "assistant", reply);

    return {
  reply,
  intent,
  state: mapIntentToState(intent)
};
    }
if (user.stage === "hot" && user.messageCount > 3) {

  const reply = "Sana özel bugün PPF kampanyası var. İstersen aracına uygun fiyatı çıkarabilirim.";

  addMessage(userId, "assistant", reply);

  return {
  reply,
  intent,
  state: mapIntentToState(intent)
};
}
    // 🟡 WARM → biraz sıkıştır
    if (intent === "warm" && user.history.length > 6) {
      const reply = "Genelde bu noktada Premium tercih ediliyor çünkü koruma farkı ciddi.";

      addMessage(userId, "assistant", reply);

  return {
  reply,
  intent,
  state: mapIntentToState(intent)
};
    }

    // 🤖 AI RESPONSE
    const aiReply = await generateAIResponse(userMessage, systemPrompt);

    addMessage(userId, "assistant", aiReply);

 return {
  reply,
  intent,
  state: mapIntentToState(intent)
};

  } catch (err) {
    console.error("CHAT ERROR:", err);

 return {
  reply: "Bir hata oluştu",
  intent: "cold",
  state: "idle"
};
  }
}