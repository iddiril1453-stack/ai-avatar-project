import { generateAIResponse } from "./aiService.js";
import { classifyIntent } from "./userIntentClassifier.js";
import { salesEngine } from "./salesEngine.js";
import { getUser, addMessage, setIntent } from "./memoryStore.js";

const productMap = {
  suv: "PPF + Seramik Paket",
  sport: "Full PPF Premium",
  luxury: "Seramik + İç Koruma",
  sedan: "Standart PPF Paket",
  unknown: "Genel Koruma Paketleri"
};

export async function handleChat(userId, userMessage) {
  try {

    const user = getUser(userId);

    // ✅ USER YOKSA
    if (!user) {
      console.log("USER YOK ❌", userId);

      return {
        reply: "Seni yeni tanıyorum, başlayalım.",
        intent: "cold",
        state: "idle"
      };
    }

    // 🧠 STATE MAP
    function mapIntentToState(intent) {
      if (intent === "hot") return "talking";
      if (intent === "warm") return "thinking";
      return "idle";
    }

    // =========================
    // 🧠 USER MESSAGE KAYDET
    // =========================
    addMessage(userId, "user", userMessage);

    // 🔥 MEMORY UPDATE (EN KRİTİK FIX)
    user.messageCount = (user.messageCount || 0) + 1;
    user.stage = updateStage(user);

    // =========================
    // 🧠 INTENT
    // =========================
    const intent = classifyIntent(userMessage);
    setIntent(userId, intent);

    console.log("USER:", user);
    console.log("INTENT:", intent);

    // =========================
    // 🧠 SYSTEM PROMPT
    // =========================
    const systemPrompt = `
Sen Todi adında premium bir araç kaplama danışmanısın.

Görevin:
- kullanıcıya yardımcı olmak
- güven vermek
- doğru ürünü önermek
- satışa doğal şekilde yönlendirmek

KONUŞMA TARZI:
- kısa konuş
- doğal konuş
- arkadaş canlısı ol
- gereksiz uzatma
- emoji kullanma
- madde listesi yapma

SATIŞ DAVRANIŞI:
- cold → bilgi ver
- warm → yönlendir
- hot → teklif + kapama

KULLANICI SEVİYESİ:
${user.stage}

KULLANICI GEÇMİŞİ:
${(user.history || [])
  .map(m => `${m.role}: ${m.content}`)
  .join("\n")}
`;

    // =========================
    // 🔥 HOT USER (TEK KAYNAK)
    // =========================
    if (user.stage === "hot") {

      const reply = salesEngine(userMessage, intent);

      addMessage(userId, "assistant", reply);

      return {
        reply,
        intent,
        state: mapIntentToState("hot")
      };
    }

    // =========================
    // 🟡 WARM LOGIC
    // =========================
    if (user.stage === "warm" && user.history.length > 6) {

      const reply =
        "Genelde bu noktada Premium PPF tercih ediliyor çünkü koruma farkı ciddi oluyor.";

      addMessage(userId, "assistant", reply);

      return {
        reply,
        intent,
        state: mapIntentToState("warm")
      };
    }

    // =========================
    // 🤖 AI RESPONSE
    // =========================
    const productType = detectProductType(userMessage);
const recommendation = productMap[productType];
    const aiReply = await generateAIResponse(userMessage, systemPrompt);

    const finalReply = `${aiReply}\n\nSenin aracın için önerim: ${recommendation}`;

addMessage(userId, "assistant", finalReply);

    return {
      reply: aiReply,
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

// =========================
// 🧠 STAGE SYSTEM (GLOBAL)
// =========================
function updateStage(user) {

  if (user.messageCount <= 2) return "cold";
  if (user.messageCount <= 6) return "warm";
  return "hot";
}
function detectProductType(message) {

  const msg = message.toLowerCase();

  if (msg.includes("suv") || msg.includes("range") || msg.includes("jeep"))
    return "suv";

  if (msg.includes("bmw") || msg.includes("porsche") || msg.includes("amg"))
    return "sport";

  if (msg.includes("mercedes") || msg.includes("audi") || msg.includes("bmw 7"))
    return "luxury";

  if (msg.includes("sedan") || msg.includes("passat") || msg.includes("corolla"))
    return "sedan";

  return "unknown";
}