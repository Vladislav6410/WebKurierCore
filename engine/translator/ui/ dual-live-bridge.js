function guessCyrSpecific(text) {
  const t = (text || "").toLowerCase();

  // Ukrainian strong markers
  if (/[їєґ]/.test(t)) return "uk";

  // Russian strong markers
  if (/[ыэъ]/.test(t)) return "ru";

  // Ukrainian common words
  if (/\b(що|це|як|але|дякую|будь ласка)\b/.test(t)) return "uk";

  // Russian common words
  if (/\b(что|это|как|но|спасибо|пожалуйста)\b/.test(t)) return "ru";

  return "";
}