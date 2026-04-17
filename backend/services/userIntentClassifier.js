export function classifyIntent(message) {
  const msg = message.toLowerCase();

  // 👋 GREETING
  if (
    msg.includes("merhaba") ||
    msg.includes("selam") ||
    msg.includes("hey")
  ) {
    return "greet";
  }

  // 🔥 HOT
  if (
    msg.includes("randevu") ||
    msg.includes("alacağım") ||
    msg.includes("yaptırmak") ||
    msg.includes("hemen") ||
    msg.includes("fiyat")
  ) {
    return "hot";
  }

  // 🟡 WARM
  if (
    msg.includes("ne kadar") ||
    msg.includes("paket") ||
    msg.includes("fark") ||
    msg.includes("nasıl") ||
    msg.includes("detay")
  ) {
    return "warm";
  }

  return "cold";
}