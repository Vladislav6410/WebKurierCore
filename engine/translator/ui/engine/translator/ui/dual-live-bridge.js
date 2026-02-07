/**
 * WebKurierPhoneCore — Dual Live Bridge
 * Stable direction choice for live bilingual mode.
 */

import { guessCyrSpecific } from "./language_detect_web.js";

const state = {
  enabled: false,
  pair: { a: "ru-RU", b: "de-DE" }, // default
};

/**
 * Extract base language from locale.
 * "de-DE" -> "de", "ru" -> "ru"
 */
function baseLangFromLocale(locale) {
  const s = (locale || "").trim();
  if (!s) return "";
  return s.split(/[-_]/)[0].toLowerCase();
}

/**
 * Language family buckets (for robust fallback)
 * Expand as needed.
 */
function langFamily(code) {
  const c = (code || "").toLowerCase();

  // Cyrillic family (common in your use-case)
  const cyr = new Set(["ru", "uk", "be", "bg", "sr", "mk", "kk", "ky", "mn", "tg", "uz"]);
  if (cyr.has(c)) return "cyr";

  // Latin family (rough bucket)
  const lat = new Set([
    "en","de","pl","fr","es","it","pt","nl","sv","no","da","fi","cs","sk","hu","ro","hr","sl","tr"
  ]);
  if (lat.has(c)) return "lat";

  // CJK bucket
  const cjk = new Set(["zh", "ja", "ko"]);
  if (cjk.has(c)) return "cjk";

  // Semitic bucket
  const sem = new Set(["ar", "he"]);
  if (sem.has(c)) return "sem";

  // Indic bucket (extend later)
  const ind = new Set(["hi"]);
  if (ind.has(c)) return "ind";

  return "other";
}

/**
 * Returns true if codes should be treated as "compatible match" for direction.
 * Example: detected "ru" matches base "uk" if both are Cyrillic.
 */
function familyMatch(a, b) {
  const fa = langFamily(a);
  const fb = langFamily(b);
  return fa !== "other" && fa === fb;
}

/**
 * If both sides are Cyrillic (ru<->uk), we can do better than "always A->B".
 * Use strong markers to pick a side deterministically.
 */
function decideWithinCyrPair(textSample, baseA, baseB) {
  // baseA/baseB are both cyr here
  const hint = guessCyrSpecific(textSample || "");
  if (!hint) return null;

  if (hint === baseA) return { from: state.pair.a, to: state.pair.b };
  if (hint === baseB) return { from: state.pair.b, to: state.pair.a };

  return null;
}

/**
 * Stable direction decision.
 * detectedBaseLang: e.g. "ru","uk","de","pl"
 * textSample: optional (for ru<->uk better decision)
 */
function decideDirection(detectedBaseLang, textSample = "") {
  const d = (detectedBaseLang || "").toLowerCase();

  const baseA = baseLangFromLocale(state.pair.a);
  const baseB = baseLangFromLocale(state.pair.b);

  // If pair misconfigured, fallback safely
  if (!baseA || !baseB || baseA === "auto" || baseB === "auto") {
    return { from: state.pair.a, to: state.pair.b };
  }

  // Direct matches
  if (d === baseA) return { from: state.pair.a, to: state.pair.b };
  if (d === baseB) return { from: state.pair.b, to: state.pair.a };

  // If both sides are same family (e.g., ru <-> uk), try to disambiguate by markers
  if (familyMatch(d, baseA) && familyMatch(d, baseB)) {
    if (langFamily(baseA) === "cyr") {
      const better = decideWithinCyrPair(textSample, baseA, baseB);
      if (better) return better;
    }
    // Deterministic stable fallback:
    return { from: state.pair.a, to: state.pair.b };
  }

  // Family-based fallback (especially Cyrillic)
  if (familyMatch(d, baseA) && !familyMatch(d, baseB)) {
    return { from: state.pair.a, to: state.pair.b };
  }
  if (familyMatch(d, baseB) && !familyMatch(d, baseA)) {
    return { from: state.pair.b, to: state.pair.a };
  }

  // Unknown -> stable default
  return { from: state.pair.a, to: state.pair.b };
}

/* ========= Public API (use from UI) ========= */

export function initDualLiveBridge() {
  // optional: attach listeners here
  console.log("[DualLive] bridge init");
}

export function enableDualLive(on = true) {
  state.enabled = !!on;
  console.log("[DualLive] enabled:", state.enabled);
}

export function setDualPair(a, b) {
  state.pair = { a, b };
  console.log("[DualLive] pair:", state.pair);
}

/**
 * Call this when you have new recognized text + detected language.
 * You can wire it to STT events.
 */
export function getDirectionForText({ detectedBaseLang, textSample }) {
  return decideDirection(detectedBaseLang, textSample || "");
}