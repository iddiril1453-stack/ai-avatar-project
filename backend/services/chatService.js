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

// =========================
// 🧠 TODICAR KNOWLEDGE BASE
// =========================
export const todicarKnowledge = `

🚫 TODICAR BİR ARAÇ SATIŞ PLATFORMU DEĞİLDİR
TODICAR = Araç YENİLEME + KORUMA + KOZMETİK MERKEZİ

🏢 NEDEN TODICAR?

01 Premium Malzeme
TShield, TGuard, Wrexpro, Avery Dennison, Rhoswax, HDtecs ve XPEL gibi sektörün öncü markalarını kullanıyoruz.

02 Uzman Teknisyenler
Ekibimiz 15+ yıllık deneyime ve fabrika sertifikalarına sahiptir.

03 Her Şey Tek Yerde
Kaplama, cam filmi, multimedya, ses sistemleri tek merkezde.

04 Garantili Hizmet
Tüm işlemler resmi garanti kapsamındadır.

━━━━━━━━━━━━━━━━━━
🔒 ŞEFFAF KAPLAMA (PPF) - TSHIELD
━━━━━━━━━━━━━━━━━━

AMACI:
Aracın boyasını çizik, taş ve darbelere karşı korumak.

ÖZELLİKLER:
- 10 yıl ömür
- 5 yıl garanti
- self-healing (kendi kendini onarma)
- UV koruma
- taş darbe koruması
- görünmez koruma
- ekstra parlaklık
- araç satılsa bile garanti devre eder

UYGULAMA:
01 araç inceleme
02 yüzey hazırlığı
03 film kesimi
04 uygulama
05 kürleme
06 teslim

PAKETLER:
- başlangıç paket
- deluxe paket
- premium paket

SIKÇA SORULANLAR:
PPF ne kadar dayanır? → 10 yıl
Boya bozar mı? → Hayır
Hangi alanlara uygulanır? → Tüm boyalı yüzeyler

━━━━━━━━━━━━━━━━━━
💎 SERAMİK KAPLAMA - WREXPRO
━━━━━━━━━━━━━━━━━━

AMACI:
Parlaklık + su iticilik + boya koruma

ÖZELLİKLER:
- nano teknoloji
- yüksek parlaklık
- su itici yüzey
- kolay temizlik
- 2 yıl / 5 yıl garanti

UYGULAMA:
01 yıkama
02 boya düzeltme
03 yüzey hazırlığı
04 uygulama
05 kürleme

SIKÇA SORULANLAR:
Ne kadar sürer? → 2-5 yıl koruma
PPF ile olur mu? → Evet

━━━━━━━━━━━━━━━━━━
🌡️ CAM FİLMİ - TGUARD
━━━━━━━━━━━━━━━━━━

AMACI:
Isı engelleme + UV koruma + gizlilik

ÖZELLİKLER:
- %99 ısı engelleme
- %100 UV koruma
- karbon materyal
- cam güçlendirme
- ömür boyu garanti
- araç satılsa bile devam eder

UYGULAMA:
01 cam temizliği
02 kesim
03 uygulama
04 kontrol

SIKÇA SORULANLAR:
Yasal mı? → Ön cam hariç yasal
Süre? → 2-4 saat

━━━━━━━━━━━━━━━━━━
✨ PASTA & CİLA - RHOSWAX
━━━━━━━━━━━━━━━━━━

AMACI:
Çizik giderme + parlaklık + yüzey yenileme

ÖZELLİKLER:
- kılcal çizik giderme
- showroom parlaklığı
- reçine temizliği
- renk canlandırma
- mat yüzey düzeltme

UYGULAMA:
01 boya analizi
02 yıkama
03 pasta
04 cila

SIKÇA SORULANLAR:
Derin çizik? → Hayır
Ne sıklık? → Yılda 1

━━━━━━━━━━━━━━━━━━
🧽 DETAYLI TEMİZLİK - TODIPRO
━━━━━━━━━━━━━━━━━━

AMACI:
Aracı fabrika temizliğine getirmek

ÖZELLİKLER:
- iç dış temizlik
- buharlı temizlik
- deri bakım
- koku giderme
- motor temizliği

UYGULAMA:
01 değerlendirme
02 dış temizlik
03 iç temizlik
04 bakım
05 final

SIKÇA SORULANLAR:
Süre? → 2-6 saat
Ne sıklık? → 6 ay - 1 yıl

━━━━━━━━━━━━━━━━━━
🎧 MULTIMEDYA - HDTECS
━━━━━━━━━━━━━━━━━━

AMACI:
Araç içi teknoloji yükseltme

ÖZELLİKLER:
- CarPlay
- Android Auto
- kablosuz bağlantı
- ses sistemleri

━━━━━━━━━━━━━━━━━━
🧠 TODICAR KURALLARI

- araç satışı yok
- sadece hizmet
- danışman gibi konuş
- baskı yok
- kısa cevap
- güven odaklı

KULLANICI SEVİYESİ:
${user?.stage || "unknown"}

`;

// system prompt FIX
const systemPrompt = todicarKnowledge;

export async function handleChat(userId, userMessage) {
  try {

    const user = getUser(userId);

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

    let extra = "";
    if (lead.interestLevel >= 2) {
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