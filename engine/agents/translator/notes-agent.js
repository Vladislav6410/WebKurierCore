/**
 * Translator Notes ("AI Notes") — local storage first.
 * Later you can sync to Dropbox / Chain.
 */

const KEY = "wk_translator_notes_v1";

function nowISO() {
  return new Date().toISOString();
}

export function loadNotes() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveNotes(notes) {
  localStorage.setItem(KEY, JSON.stringify(notes));
}

export function addNote({ title, fromLang, toLang, transcript = [], summary = "" }) {
  const notes = loadNotes();
  const note = {
    id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
    createdAt: nowISO(),
    title: title || "Conversation",
    fromLang,
    toLang,
    transcript, // [{ts, fromText, toText, dir}]
    summary
  };
  notes.unshift(note);
  saveNotes(notes);
  return note;
}

/**
 * Summary stub:
 * - today: simple heuristic
 * - later: route to LLM summarizer (WebKurierCore agent router)
 */
export function summarizeTranscript(transcript, uiLocale = "ru") {
  if (!transcript?.length) return uiLocale.startsWith("ru") ? "Пусто." : "Empty.";

  // lightweight summary: first + last + topic guess
  const first = transcript[0]?.toText || transcript[0]?.fromText || "";
  const last = transcript[transcript.length - 1]?.toText || transcript[transcript.length - 1]?.fromText || "";

  const header = uiLocale.startsWith("ru")
    ? `Кратко: диалог из ${transcript.length} реплик.`
    : `Brief: ${transcript.length} turns.`;

  return `${header}\n• Start: ${first.slice(0, 120)}\n• End: ${last.slice(0, 120)}`;
}