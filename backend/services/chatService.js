import { generateAIResponse } from "./aiService.js";
import { classifyIntent } from "./userIntentClassifier.js";
import { salesEngine } from "./salesEngine.js";
import { getUser, addMessage, setIntent } from "./memoryStore.js";

export async function handleChat(userId, userMessage) {
  try {

    const user = getUser(userId);

// ✅ KRİTİK FIX
if (!user) {
  console.log("USER YOK ❌", userId);

  return {
    reply: "Seni yeni tanıyorum, başlayalım.",
    intent: "cold",
    state: "idle"
  };
}

function mapIntentToState(intent) {
  if (intent === "hot") return "talking";
  if (intent === "warm") return "thinking";
  return "idle";
}


    // 🧠 USER MESSAGE KAYDET
    addMessage(userId, "user", userMessage);

    const intent = classifyIntent(userMessage);
    setIntent(userId, intent);



console.log("USER:", user);
console.log("INTENT:", intent);


const systemPrompt = `
Sen Todi adında premium bir araç koruma ve kaplama danışmanısın.

Görevin:
- kullanıcıya yardımcı olmak
- güven vermek
- doğru ürünü önermek
- satışa doğal şekilde yönlendirmek

KONUŞMA TARZI:
- kısa konuş
- doğal konuş
- arkadaş canlısı ol
- aşırı resmi olma
- gereksiz uzun açıklama yapma
- her mesajda satış yapmaya çalışma
- kullanıcıyla gerçek temsilci gibi konuş

SATIŞ DAVRANIŞI:
- kullanıcı ilgilenirse fırsat sun
- kullanıcı kararsızsa güven ver
- kullanıcı sıcaksa teklif öner
- gerektiğinde soru sor
- kullanıcıyı bunaltma

TODICAR HİZMETLERİ:
- PPF kaplama
- seramik kaplama
- cam filmi
- araç koruma çözümleri

KULLANICI GEÇMİŞİ:
${(user.history || [])
  .map(m => `${m.role}: ${m.content}`)
  .join("\n")}

KULLANICI SEVİYESİ:
${user.stage}

ÖNEMLİ:
- maksimum 2-3 kısa paragraf
- doğal insan gibi konuş
- emoji kullanma
- madde listesi yapma
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