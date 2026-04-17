export function salesEngine(message, intent) {

  const msg = message.toLowerCase();

  const urgencyPhrases = [
    "bugün kampanya var",
    "şu an çok talep var",
    "stok sınırlı",
    "hemen randevu alabiliriz"
  ];

  const randomUrgency = urgencyPhrases[
    Math.floor(Math.random() * urgencyPhrases.length)
  ];

  // 🔥 HOT USER
  if (intent === "hot") {
    return `Premium paket bu araç için en doğru seçim. ${randomUrgency}`;
  }

  // 🟡 WARM USER
  if (intent === "warm") {
    return `Genelde Premium öneriyoruz çünkü fark küçük ama koruma çok daha güçlü. ${randomUrgency}`;
  }

  // 🔵 COLD USER
  return `PPF aracını çizik ve taş darbelerine karşı korur. İstersen sana en uygun paketi birlikte seçebiliriz.`;
}