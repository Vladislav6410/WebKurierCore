/**
 * WebKurierPhoneCore — language-pair-picker.js
 * Small UI widget for Dual Live language pair:
 * - select A/B (locales)
 * - swap
 * - save/load from localStorage
 *
 * Usage:
 *   import { mountLanguagePairPicker, loadSavedPair } from "../translator/ui/language-pair-picker.js";
 *   const saved = loadSavedPair();
 *   mountLanguagePairPicker({ mountEl, initialPair: saved, onChangePair });
 */

const LS_KEY = "WK_DUAL_LIVE_PAIR_V1";
const DEFAULT_PAIR = { a: "ru-RU", b: "de-DE" };

// Minimal but practical list; expand later from languages.json
const LOCALES = [
  { v: "auto", label: "Auto (detect)" },

  // Cyrillic common
  { v: "uk-UA", label: "Українська (UA)" },
  { v: "ru-RU", label: "Русский (RU)" },

  // EU / common
  { v: "de-DE", label: "Deutsch (DE)" },
  { v: "pl-PL", label: "Polski (PL)" },
  { v: "en-US", label: "English (US)" },
  { v: "fr-FR", label: "Français (FR)" },
  { v: "es-ES", label: "Español (ES)" },
  { v: "it-IT", label: "Italiano (IT)" },
  { v: "nl-NL", label: "Nederlands (NL)" },
  { v: "sv-SE", label: "Svenska (SE)" },
  { v: "no-NO", label: "Norsk (NO)" },
  { v: "da-DK", label: "Dansk (DK)" },
  { v: "fi-FI", label: "Suomi (FI)" },
  { v: "cs-CZ", label: "Čeština (CZ)" },
  { v: "sk-SK", label: "Slovenčina (SK)" },
  { v: "ro-RO", label: "Română (RO)" },
  { v: "bg-BG", label: "Български (BG)" },
  { v: "sr-RS", label: "Srpski (RS)" },
];

export function loadSavedPair() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...DEFAULT_PAIR };
    const parsed = JSON.parse(raw);
    const a = typeof parsed?.a === "string" ? parsed.a : DEFAULT_PAIR.a;
    const b = typeof parsed?.b === "string" ? parsed.b : DEFAULT_PAIR.b;
    return { a, b };
  } catch {
    return { ...DEFAULT_PAIR };
  }
}

export function savePair(pair) {
  const safe = {
    a: (pair?.a || DEFAULT_PAIR.a),
    b: (pair?.b || DEFAULT_PAIR.b),
  };
  localStorage.setItem(LS_KEY, JSON.stringify(safe));
  return safe;
}

export function mountLanguagePairPicker({
  mountEl,
  initialPair,
  onChangePair,
  title = "🧭 Dual Live — Language Pair",
}) {
  if (!mountEl) throw new Error("mountLanguagePairPicker: mountEl is required");

  const pair = initialPair ? { ...initialPair } : loadSavedPair();

  mountEl.innerHTML = `
    <div class="wk-voice-box" style="margin-top:12px">
      <h2 class="wk-h2">${escapeHtml(title)}</h2>

      <div class="wk-row">
        <label class="wk-status" style="min-width:28px">A:</label>
        <select id="wk-pair-a" class="wk-control" style="min-width:220px"></select>

        <button id="wk-pair-swap" class="wk-control" title="Swap A/B">⇄ Swap</button>

        <label class="wk-status" style="min-width:28px">B:</label>
        <select id="wk-pair-b" class="wk-control" style="min-width:220px"></select>

        <button id="wk-pair-save" class="wk-control">Save</button>
      </div>

      <div class="wk-status" id="wk-pair-hint" style="margin-top:10px"></div>
    </div>
  `;

  const elA = mountEl.querySelector("#wk-pair-a");
  const elB = mountEl.querySelector("#wk-pair-b");
  const elSwap = mountEl.querySelector("#wk-pair-swap");
  const elSave = mountEl.querySelector("#wk-pair-save");
  const elHint = mountEl.querySelector("#wk-pair-hint");

  function setHintLocal(p) {
    const a = p?.a || DEFAULT_PAIR.a;
    const b = p?.b || DEFAULT_PAIR.b;

    const autoA = a === "auto";
    const autoB = b === "auto";
    const warn = (autoA || autoB)
      ? "⚠️ Auto in pair can reduce stability. Best practice: set fixed A/B locales for Dual Live."
      : "✅ Stable pair (fixed locales).";

    if (elHint) elHint.textContent = `${a} ↔ ${b} • ${warn}`;
  }

  function emitChange(next) {
    setHintLocal(next);
    if (typeof onChangePair === "function") onChangePair(next);
  }

  fillSelect(elA, pair.a);
  fillSelect(elB, pair.b);
  setHintLocal(pair);

  elA.addEventListener("change", () => {
    pair.a = elA.value;
    emitChange({ ...pair });
  });

  elB.addEventListener("change", () => {
    pair.b = elB.value;
    emitChange({ ...pair });
  });

  elSwap.addEventListener("click", () => {
    const tmp = pair.a;
    pair.a = pair.b;
    pair.b = tmp;
    elA.value = pair.a;
    elB.value = pair.b;
    emitChange({ ...pair });
  });

  elSave.addEventListener("click", () => {
    const saved = savePair(pair);
    setHintLocal(saved);
    emitChange({ ...pair });
  });

  // fire initial callback
  emitChange({ ...pair });

  return {
    getPair: () => ({ ...pair }),
    setPair: (next) => {
      pair.a = next?.a || pair.a;
      pair.b = next?.b || pair.b;
      elA.value = pair.a;
      elB.value = pair.b;
      emitChange({ ...pair });
    },
    save: () => savePair(pair),
  };
}

function fillSelect(selectEl, selected) {
  selectEl.innerHTML = LOCALES.map(o => {
    const sel = o.v === selected ? "selected" : "";
    return `<option value="${escapeAttr(o.v)}" ${sel}>${escapeHtml(o.label)}</option>`;
  }).join("");

  // if selected not in list, append it
  if (selected && ![...selectEl.options].some(op => op.value === selected)) {
    const opt = document.createElement("option");
    opt.value = selected;
    opt.textContent = selected;
    opt.selected = true;
    selectEl.appendChild(opt);
  }
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function escapeAttr(s) {
  // attributes should not contain backticks; also escape HTML chars
  return escapeHtml(s).replace(/`/g, "&#96;");
}