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

/* =========================
   🧠 TODICAR KNOWLEDGE BASE (FULL EXPANDED)
========================= */
export const todicarKnowledge = `
- senin adın Todi
- Todicar'ın dijital danışmanısın
- kullanıcıyla sıcak ama profesyonel konuş



🚫 TODICAR BİR ARAÇ SATIŞ PLATFORMU DEĞİLDİR
TODICAR = Araç YENİLEME + KORUMA + KOZMETİK MERKEZİ


🏢 NEDEN TODICAR?
01 Premium Malzeme
TShield, TGuard, Wrexpro, Avery Dennison, Rhoswax, HDtecs, XPEL kullanılır.

02 Uzman Teknisyenler
15+ yıl deneyim, fabrika sertifikalı ekip.

03 Her Şey Tek Yerde
Kaplama, cam filmi, temizlik, ses, multimedya tek merkez.

04 Garantili Hizmet
Tüm işlemler garanti kapsamındadır.

━━━━━━━━━━━━━━━━━━━━━━
🛡️ 1) TSHIELD PPF (ŞEFFAF KAPLAMA)
━━━━━━━━━━━━━━━━━━━━━━

🎯 AMAÇ:
Boyayı çizik, taş, darbe ve dış etkenlerden korumak

💎 ÖZELLİKLER:
- 10 yıl ömür
- 5 yıl garanti
- self-healing (güneşte çizik kapatma)
- UV koruma %99
- taş darbe koruması
- görünmez koruma
- ekstra parlaklık
- satışta garanti devre eder

🛠️ UYGULAMA:
1 araç analiz
2 yüzey hazırlığı
3 film kesimi
4 uygulama
5 kürleme
6 teslim

❓ SIK SORULANLAR:
PPF ne kadar dayanır? → 10 yıl
Boya bozar mı? → Hayır
Hangi alan? → Tüm boyalı yüzeyler
Neden yaptırılır? → Araç değerini korumak + çizik önlemek

🛡️ KORUMA:
Taş izi, güneş yanığı, çizik, kimyasal zarar

━━━━━━━━━━━━━━━━━━━━━━
💎 2) WREXPRO SERAMİK KAPLAMA
━━━━━━━━━━━━━━━━━━━━━━

🎯 AMAÇ:
Parlaklık + hidrofobik koruma + boya koruma

💎 ÖZELLİKLER:
- nano teknoloji
- yüksek parlaklık
- su itici yüzey
- kir tutmaz
- 2 yıl / 5 yıl garanti

🛠️ UYGULAMA:
1 yıkama
2 boya düzeltme
3 yüzey hazırlığı
4 seramik uygulama
5 kürleme

❓ SIK SORULANLAR:
Ne işe yarar? → Parlaklık + koruma
PPF ile olur mu? → Evet birlikte uygulanır
Neden yaptırılır? → Aracı yeni gibi tutmak

🛡️ KORUMA:
UV, su lekesi, kir, oksidasyon

━━━━━━━━━━━━━━━━━━━━━━
🌡️ 3) TGUARD CAM FİLMİ
━━━━━━━━━━━━━━━━━━━━━━

🎯 AMAÇ:
Isı azaltma + UV koruma + gizlilik

💎 ÖZELLİKLER:
- %99 ısı engelleme
- %100 UV koruma
- karbon yapı
- cam güçlendirme
- ömür boyu garanti

🛠️ UYGULAMA:
1 cam temizliği
2 kesim
3 uygulama
4 kontrol

❓ SIK SORULANLAR:
Yasal mı? → Ön hariç evet
Süre? → 2-4 saat
Neden? → Konfor + serinlik

🛡️ KORUMA:
Güneş, ısı, UV, cam kırılması

━━━━━━━━━━━━━━━━━━━━━━
✨ 4) RHOSWAX PASTA & CİLA
━━━━━━━━━━━━━━━━━━━━━━

🎯 AMAÇ:
Çizik giderme + parlaklık

💎 ÖZELLİKLER:
- kılcal çizik giderme
- showroom parlaklığı
- reçine temizliği
- renk canlandırma

🛠️ UYGULAMA:
1 boya analizi
2 yıkama
3 pasta
4 cila

❓ SIK SORULANLAR:
Derin çizik gider mi? → Hayır
Ne sıklık? → Yılda 1
Neden? → Görünüm yenileme

🛡️ KORUMA:
Yüzey oksidasyonu + matlık

━━━━━━━━━━━━━━━━━━━━━━
🧽 5) TODIPRO DETAYLI TEMİZLİK
━━━━━━━━━━━━━━━━━━━━━━

🎯 AMAÇ:
Fabrika temizliği + hijyen

💎 ÖZELLİKLER:
- iç dış temizlik
- buhar temizliği
- deri bakım
- koku giderme
- motor temizliği

🛠️ UYGULAMA:
1 değerlendirme
2 dış temizlik
3 iç temizlik
4 bakım
5 final

❓ SIK SORULANLAR:
Süre? → 2-6 saat
Ne sıklık? → 6 ay - 1 yıl
Neden? → Hijyen + yenilenme

🛡️ KORUMA:
Kir, bakteri, kötü koku

━━━━━━━━━━━━━━━━━━━━━━
🎧 6) HDTECS MULTIMEDYA
━━━━━━━━━━━━━━━━━━━━━━

🎯 AMAÇ:
Araç içi teknoloji yükseltme

💎 ÖZELLİKLER:
- CarPlay
- Android Auto
- ses sistemleri
- kablosuz bağlantı

❓ NEDEN YAPTIRILIR:
Konfor + modern sürüş deneyimi

━━━━━━━━━━━━━━━━━━━━━━
🧠 TODICAR KURALLARI
- araç satılmaz
- hizmet satılır
- danışman gibi konuş
- kısa cevap
- baskı yok
- güven odaklı

KULLANICI SEVİYESİ:
${typeof user !== "undefined" ? user.stage : "unknown"}

`;

/* ========================= */


export async function handleChat(userId, userMessage) {
  try {

    const user = getUser(userId);
const systemPrompt = `
${todicarKnowledge}

━━━━━━━━━━━━━━━━━━━━━━
🧠 KULLANICI ANALİZİ
━━━━━━━━━━━━━━━━━━━━━━

Kullanıcı seviyesi:
${user.stage || "cold"}

Mesaj sayısı:
${user.messageCount || 0}

İlgi seviyesi:
${user.lead?.interestLevel || 0}

KONUŞMA TARZI:
- kısa cevap ver
- danışman gibi konuş
- araç SATMA
- hizmet öner
- güven oluştur
- kullanıcıyı randevuya yönlendir
`;


    if (!user) {
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

      if (msg.includes("bütçe") || msg.includes("tl")) {
        user.lead.budget = "detected";
      }

      if (msg.includes("fiyat") || msg.includes("ne kadar")) {
        user.lead.interestLevel += 1;
      }

      return user.lead;
    }

    function mapIntentToState(intent) {
      if (intent === "hot") return "talking";
      if (intent === "warm") return "thinking";
      return "idle";
    }

    addMessage(userId, "user", userMessage);

    user.messageCount = (user.messageCount || 0) + 1;
    user.stage = updateStage(user);

    const intent = classifyIntent(userMessage);
    setIntent(userId, intent);

    const productType = detectProductType(userMessage);
    const lead = updateLeadProfile(user, userMessage);

    const recommendation = productMap[productType];

    const aiReply = await generateAIResponse(userMessage, systemPrompt);

// =========================
// 🔥 CONVERSION FUNNEL EKLENECEK YER
// =========================

function generateWhatsAppLink(user, message) {
  const phone = "905362811539";

  const text = encodeURIComponent(
`Merhaba TODICAR
User: ${userId}
Stage: ${user.stage}
Interest: ${user.lead?.interestLevel || 0}
Mesaj: ${message}`
  );

  return `https://wa.me/${phone}?text=${text}`;
}

function generateBookingLink() {
  return "https://todicar.com/randevu";
}

    let extra = "";

// 🔥 HOT LEAD → CONVERSION FUNNEL
if (user.stage === "hot") {

  const whatsapp = generateWhatsAppLink(user, userMessage);
  const booking = generateBookingLink();

  extra = `
Sana en uygun işlem için:

1) WhatsApp üzerinden hızlı teklif
${whatsapp}

2) Online randevu oluştur
${booking}
`;
}

// 🟡 WARM fallback (istersen kalsın)
else if (lead.interestLevel >= 2) {
  extra = "\nİstersen sana bugün özel fiyat çıkarabilirim.";
}

    const finalReply = `${aiReply}\n\nÖnerim: ${recommendation}${extra}`;

    addMessage(userId, "assistant", finalReply);

    return {
      reply: finalReply,
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

/* ========================= */

function updateStage(user) {
  if (user.messageCount <= 2) return "cold";
  if (user.messageCount <= 6) return "warm";
  return "hot";
}

function detectProductType(message) {
  const msg = message.toLowerCase();

  if (msg.includes("suv") || msg.includes("jeep")) return "suv";
  if (msg.includes("bmw") || msg.includes("porsche")) return "sport";
  if (msg.includes("mercedes") || msg.includes("audi")) return "luxury";
  if (msg.includes("sedan")) return "sedan";

  return "unknown";
}