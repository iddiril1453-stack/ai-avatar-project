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

function updateLeadProfile(user, message) {

  if (!user.lead) {
    user.lead = {
      budget: null,
      carType: null,
      interestLevel: 0
    };
  }

  const msg = message.toLowerCase();

  // bütçe yakalama
  if (msg.includes("bütçe") || msg.includes("tl")) {
    user.lead.budget = "detected";
  }

  // ilgi seviyesi
  if (msg.includes("fiyat") || msg.includes("ne kadar")) {
    user.lead.interestLevel += 1;
  }

  return user.lead;
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
export const todicarKnowledge = `

🚫 TODICAR BİR ARAÇ SATIŞ PLATFORMU DEĞİLDİR
TODICAR = Araç YENİLEME + KORUMA + KOZMETİK MERKEZİ

---

🏢 NEDEN TODICAR?

01 - Premium Malzeme
TShield, TGuard, Wrexpro, Avery Dennison, Rhoswax, HDtecs, XPEL kullanılır.

02 - Uzman Teknisyenler
15+ yıl deneyim, fabrika sertifikalı uzman ekip.

03 - Her Şey Tek Yerde
Kaplama, cam filmi, temizlik, multimedya, ses sistemleri tek merkez.

04 - Garantili Hizmet
Tüm işlemler resmi garanti kapsamındadır.

---

🛠️ HİZMETLER

🔒 KORUMA
- TShield PPF (şeffaf kaplama)
- Wrexpro Seramik Kaplama
- TGuard Cam Filmi

🧼 KOZMETİK
- Rhoswax Pasta & Cila
- TodiPro Detaylı Temizlik
- Boyasız Göçük Onarım (DentDoc)

🎧 DONANIM
- HDtecs Multimedya
- Ses sistemleri
- İç dış dizayn

---

🧠 ÜRÜN DETAYLARI

🛡️ TShield PPF
- 10 yıl ömür
- 5 yıl garanti
- self-healing (kendi kendini onarma)
- UV koruma
- taş & çizik koruması
- görünmez koruma
- araç satılsa bile garanti devre eder

---

💎 Wrexpro Seramik Kaplama
- 2 yıl / 5 yıl seçenek
- nano teknoloji
- yüksek parlaklık
- su itici yüzey
- kolay temizlik

---

🌡️ TGuard Cam Filmi
- ömür boyu garanti
- %99 ısı engelleme
- %100 UV koruma
- karbon teknoloji
- cam güçlendirme

---

✨ Rhoswax Pasta & Cila
AMACI:
- kılcal çizik giderme
- showroom parlaklığı
- reçine temizliği
- renk canlandırma
- mat yüzey düzeltme

UYGULAMA:
01 boya analizi
02 yıkama & dekontaminasyon
03 pasta uygulama
04 cila & koruma

---

🧽 TodiPro Detaylı Temizlik
- iç & dış temizlik
- buharlı temizlik
- deri bakım
- koku giderme (ozon)
- motor temizliği

---

🔧 UYGULAMA MANTIĞI

PPF:
01 araç analizi
02 yüzey hazırlığı
03 film kesimi
04 uygulama
05 kürleme
06 teslim

---

💬 SIKÇA SORULANLAR

❓ PPF ne kadar dayanır?
→ 10 yıl ömür + 5 yıl garanti

❓ Film boya bozar mı?
→ Hayır, doğru sökümde zarar vermez

❓ Seramik kaplama ne sağlar?
→ parlaklık + su iticilik + UV koruma

❓ Cam filmi yasal mı?
→ Ön hariç tüm camlarda yasal

❓ Detaylı temizlik ne kadar sürer?
→ 2-6 saat arası

❓ Pasta-cila çizik giderir mi?
→ Kılcal çizikleri giderir, derin çizik değil

---

🧠 SATIŞ KURALLARI

- TODICAR araç satmaz
- sadece hizmet sunar
- kullanıcıya baskı yapılmaz
- danışman gibi konuşulur
- kısa ve net cevap verilir

Cold → bilgi
Warm → öneri
Hot → teklif

---

🎯 HEDEF

- güven oluştur
- doğru hizmet öner
- kullanıcıyı randevuya yönlendir
- doğal konuşma

---

💬 KONUŞMA TARZI

- kısa cümle
- doğal insan gibi
- satışçı değil danışman gibi
- emoji yok
- liste yapma (çok gerekmedikçe)
- kullanıcıyı sıkma

---

🎯 HEDEF

Kullanıcıyı:
→ doğru hizmete yönlendir
→ güven oluştur
→ randevuya yaklaştır



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
const lead = updateLeadProfile(user, userMessage);

const recommendation = productMap[productType];
    const aiReply = await generateAIResponse(userMessage, systemPrompt);

    let extra = "";

if (lead.interestLevel >= 2) {
  extra = "\nİstersen sana bugün özel fiyat çıkarabilirim.";
}

const finalReply = `${aiReply}\n\nÖnerim: ${recommendation}${extra}`;

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