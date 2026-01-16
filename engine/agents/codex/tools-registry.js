// engine/agents/codex/tools-registry.js
// Tools registry (MVP)
//
// Purpose:
// - Single source of truth for available Codex tools
// - Human-readable descriptions for UI / debug
// - Minimal JSON-schema-like params (kept permissive for MVP)
//
// NOTE:
// Actual implementations live in:
// - api/codex-run.js -> toolsImpl
// - engine/agents/codex/tools-repo-adapter.js (repo adapter)

export const CODEX_TOOLS = [
  {
    name: "list_dir",
    title: "List Directory",
    title_ru: "Список файлов",
    description: "List directory entries with optional depth.",
    description_ru: "Показать содержимое папки с ограничением глубины.",
    params: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative path (default: .)" },
        maxDepth: { type: "number", description: "Max depth (default: 2)" }
      },
      required: ["path"]
    }
  },
  {
    name: "read_file",
    title: "Read File",
    title_ru: "Чтение файла",
    description: "Read file text (server-side) with max chars limit.",
    description_ru: "Прочитать текст файла (на сервере) с лимитом символов.",
    params: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative file path" },
        maxChars: { type: "number", description: "Max characters to return" }
      },
      required: ["path"]
    }
  },
  {
    name: "glob_file_search",
    title: "Glob Search",
    title_ru: "Поиск по шаблону",
    description: "Find files by glob-like pattern.",
    description_ru: "Найти файлы по glob-шаблону.",
    params: {
      type: "object",
      properties: {
        pattern: { type: "string", description: "Glob pattern, e.g. **/*.js" },
        root: { type: "string", description: "Root directory (default: .)" },
        maxResults: { type: "number", description: "Max results (default: 200)" }
      },
      required: ["pattern"]
    }
  },
  {
    name: "rg_search",
    title: "Ripgrep Search",
    title_ru: "Поиск по тексту (rg)",
    description: "Search repository text using ripgrep.",
    description_ru: "Поиск по тексту через ripgrep (rg).",
    params: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        root: { type: "string", description: "Root directory (default: .)" },
        maxResults: { type: "number", description: "Max matches (default: 200)" }
      },
      required: ["query"]
    }
  },
  {
    name: "apply_patch",
    title: "Apply Patch",
    title_ru: "Применить патч",
    description: "Apply unified diff patch via git apply (server-side).",
    description_ru: "Применить unified diff патч через git apply (на сервере).",
    params: {
      type: "object",
      properties: {
        patch_text: { type: "string", description: "Unified diff patch text" }
      },
      required: ["patch_text"]
    },
    security: {
      gated_by: "engine/agents/codex/policy/security-gates.js",
      patch_only: true
    }
  }
];

export function getToolsInfoText() {
  const lines = [];
  lines.push("Tools (Codex MVP):");
  for (const t of CODEX_TOOLS) {
    lines.push(`- ${t.name}: ${t.description}`);
  }
  lines.push("");
  lines.push("Security:");
  lines.push("- read before edit");
  lines.push("- patch-only writes (apply_patch)");
  lines.push("- security gates enforced before any patch");
  return lines.join("\n");
}
