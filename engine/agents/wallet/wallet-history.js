// === wallet-history.js — История транзакций WebCoin ===

const HISTORY_KEY = "wallet_transaction_history";
const MAX_HISTORY = 100;

// Получить текущую историю
export function getHistory() {
  const raw = localStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

// Добавить новую запись в историю
export function addHistoryEntry(type, amount, note = "") {
  const entry = {
    time: new Date().toISOString(),
    type, // "add", "reset", "set", "import"
    amount,
    note
  };

  const history = getHistory();
  history.unshift(entry);

  if (history.length > MAX_HISTORY) {
    history.pop();
  }

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// Очистить историю
export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

// Форматированное отображение истории
export function formatHistory(limit = 10) {
  const history = getHistory().slice(0, limit);
  if (history.length === 0) return "📭 История пуста.";

  return history.map((e, i) =>
    `#${i + 1} | ${e.time}\n▶ ${e.type} ${e.amount} WKC ${e.note ? `— ${e.note}` : ""}`
  ).join("\n\n");
}